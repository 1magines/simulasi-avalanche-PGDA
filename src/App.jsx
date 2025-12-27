import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Download, Settings, Droplets, Zap } from 'lucide-react';

const GranularAvalancheSimulation = () => {
  // State parameter simulasi
  const [gridSize, setGridSize] = useState(100);
  const [materialType, setMaterialType] = useState('sand');
  const [isUniform, setIsUniform] = useState(true);
  const [targetParticles, setTargetParticles] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [particlesDropped, setParticlesDropped] = useState(0);
  const [totalAvalanches, setTotalAvalanches] = useState(0);
  const [showSettings, setShowSettings] = useState(true);
  const [simulationPhase, setSimulationPhase] = useState('building'); // 'building', 'complete', 'disturbance'
  const [isRandomDisturbance, setIsRandomDisturbance] = useState(true);
  const [manualDisturbancePos, setManualDisturbancePos] = useState(50);
  
  // State untuk gangguan sekunder
  const [disturbanceType, setDisturbanceType] = useState('rain');
  const [disturbanceIntensity, setDisturbanceIntensity] = useState(5);
  const [isDisturbanceActive, setIsDisturbanceActive] = useState(false);
  const [disturbanceCount, setDisturbanceCount] = useState(0);
  
  const [heights, setHeights] = useState([]);
  const [avalancheData, setAvalancheData] = useState([]);
  const [recentAvalanche, setRecentAvalanche] = useState(null);
  const [disturbancePoints, setDisturbancePoints] = useState([]);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const disturbanceRef = useRef(null);
  const dataRef = useRef({ 
    heights: [], 
    avalanches: [], 
    buildingPhaseAvalanches: [],
    disturbancePhaseAvalanches: [],
    disturbanceEvents: []
  });

  // Material properties
  const materials = {
    sand: { 
      name: 'Pasir (Sand)', 
      criticalAngle: 35, 
      variance: 3,
      density: 1.6,
      cohesion: 0,
      color: '#feca57'
    },
    soil: { 
      name: 'Tanah (Soil)', 
      criticalAngle: 40, 
      variance: 5,
      density: 1.4,
      cohesion: 0.2,
      color: '#8B4513'
    },
    clay: { 
      name: 'Lempung (Clay)', 
      criticalAngle: 45, 
      variance: 8,
      density: 1.8,
      cohesion: 0.5,
      color: '#A0522D'
    },
    gravel: { 
      name: 'Kerikil (Gravel)', 
      criticalAngle: 38, 
      variance: 6,
      density: 1.7,
      cohesion: 0.1,
      color: '#808080'
    },
    mixedSoil: { 
      name: 'Tanah Campuran', 
      criticalAngle: 42, 
      variance: 10,
      density: 1.5,
      cohesion: 0.3,
      color: '#654321'
    },
    woodPellets: {
      name: 'Pelet Kayu (Wood Pellets)',
      criticalAngle: 30,
      variance: 4,
      density: 1.2,
      cohesion: 0.1,
      color: '#8B4513'
    },
  };

  const [criticalAngle, setCriticalAngle] = useState(materials[materialType].criticalAngle);

  // Inisialisasi sistem
  useEffect(() => {
    const initialHeights = new Array(gridSize).fill(0);
    setHeights(initialHeights);
    dataRef.current.heights = initialHeights;
    dataRef.current.avalanches = [];
    dataRef.current.buildingPhaseAvalanches = [];
    dataRef.current.disturbancePhaseAvalanches = [];
    dataRef.current.disturbanceEvents = [];
  }, [gridSize]);

  // Update critical angle when material changes
  useEffect(() => {
    setCriticalAngle(materials[materialType].criticalAngle);
  }, [materialType]);

  // Menggambar visualisasi
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Hitung skala
    const maxHeight = Math.max(...heights, 1);
    const xScale = width / gridSize;
    const yScale = (height - 50) / (maxHeight + 10);
    
    // Gambar grid dasar
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i * xScale, 0);
      ctx.lineTo(i * xScale, height);
      ctx.stroke();
    }
    
    // Gambar timbunan dengan warna material
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    for (let i = 0; i < heights.length; i++) {
      const x = i * xScale;
      const y = height - heights[i] * yScale;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(width, height);
    ctx.closePath();
    
    const material = materials[materialType];
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    
    // Warna gradien berdasarkan material
    if (isUniform) {
      gradient.addColorStop(0, material.color);
      gradient.addColorStop(1, material.color + '99');
    } else {
      gradient.addColorStop(0, material.color);
      gradient.addColorStop(0.5, '#feca57');
      gradient.addColorStop(1, '#8B4513');
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Gambar garis kontur
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - heights[0] * yScale);
    
    for (let i = 1; i < heights.length; i++) {
      const x = i * xScale;
      const y = height - heights[i] * yScale;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Highlight recent avalanche
    if (recentAvalanche) {
      ctx.fillStyle = simulationPhase === 'disturbance' ? 'rgba(255, 100, 100, 0.5)' : 'rgba(255, 255, 0, 0.3)';
      const startX = recentAvalanche.position * xScale;
      const width = recentAvalanche.size * xScale;
      ctx.fillRect(startX, 0, width, height);
    }
    

 // Gambar titik erosi (lubang) dengan warna berbeda
if (disturbancePoints.length > 0) {
  disturbancePoints.forEach(point => {
    const x = point.position * xScale;
    const y = height - heights[point.position] * yScale;
    
    // Highlight area erosi dengan warna merah gelap
    ctx.fillStyle = disturbanceType === 'rain' ? 'rgba(50, 100, 200, 0.6)' : 'rgba(200, 50, 50, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Ring effect untuk rain
    if (disturbanceType === 'rain') {
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, point.age * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}
    
    // Gambar informasi
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`Material: ${material.name}`, 10, 20);
    ctx.fillText(`Sudut Kritis: ${criticalAngle}°`, 10, 35);
    ctx.fillText(`Fase: ${simulationPhase === 'building' ? 'Pembentukan' : simulationPhase === 'complete' ? 'Selesai' : 'Gangguan Sekunder'}`, 10, 50);
    
    if (simulationPhase === 'disturbance') {
      const disturbanceLabel = disturbanceType === 'rain' ? '🌧️ Hujan' : 
                               disturbanceType === 'impact' ? '💥 Tumbukan' : '🌊 Getaran';
      ctx.fillText(`Gangguan: ${disturbanceLabel}`, 10, 65);
    }
    
  }, [heights, gridSize, criticalAngle, recentAvalanche, materialType, isUniform, simulationPhase, disturbancePoints, disturbanceType]);

  // Fungsi untuk menghitung kemiringan lokal dengan variasi
  const calculateSlope = (h, i) => {
    if (i === 0) return Math.abs(h[i] - h[i + 1]);
    if (i === h.length - 1) return Math.abs(h[i] - h[i - 1]);
    return Math.max(Math.abs(h[i] - h[i - 1]), Math.abs(h[i] - h[i + 1]));
  };

  // Fungsi untuk mendapatkan critical angle dengan variasi
  const getLocalCriticalAngle = () => {
    const material = materials[materialType];
    if (isUniform) {
      return Math.tan(criticalAngle * Math.PI / 180);
    } else {
      const variance = material.variance;
      const angle = criticalAngle + (Math.random() - 0.5) * variance;
      return Math.tan(angle * Math.PI / 180);
    }
  };

  // Fungsi untuk melakukan avalanche
  const performAvalanche = (h, isFromDisturbance = false) => {
    let avalanches = [];
    let changed = true;
    const material = materials[materialType];
    
    while (changed) {
      changed = false;
      const newHeights = [...h];
      
      for (let i = 0; i < h.length; i++) {
        const slope = calculateSlope(h, i);
        const localCriticalHeight = getLocalCriticalAngle();
        
        if (slope > localCriticalHeight) {
          changed = true;
          let avalancheSize = 0;
          let startPos = i;
          
          // Transfer partikel dengan kohesi
          const cohesionFactor = 1 - material.cohesion * 0.3;
          
          if (i > 0 && h[i] > h[i - 1]) {
            const transfer = Math.min(0.5 * cohesionFactor, (h[i] - h[i - 1]) / 2);
            newHeights[i] -= transfer;
            newHeights[i - 1] += transfer;
            avalancheSize++;
          }
          
          if (i < h.length - 1 && h[i] > h[i + 1]) {
            const transfer = Math.min(0.5 * cohesionFactor, (h[i] - h[i + 1]) / 2);
            newHeights[i] -= transfer;
            newHeights[i + 1] += transfer;
            avalancheSize++;
          }
          
          if (avalancheSize > 0) {
            avalanches.push({
              position: startPos,
              size: avalancheSize,
              time: Date.now(),
              fromDisturbance: isFromDisturbance,
              material: materialType,
              phase: simulationPhase,
              disturbanceType: isFromDisturbance ? disturbanceType : null,
              disturbanceIntensity: isFromDisturbance ? disturbanceIntensity : null
            });
          }
        }
      }
      
      h = newHeights;
    }
    
    return { heights: h, avalanches };
  };

  // Fungsi untuk menjatuhkan satu partikel
  const dropParticle = () => {
    const newHeights = [...dataRef.current.heights];
    
    // Posisi jatuh acak (distribusi normal di tengah)
    const center = gridSize / 2;
    const sigma = gridSize / 8;
    const randomPos = Math.floor(
      center + sigma * (Math.random() + Math.random() + Math.random() - 1.5)
    );
    const dropPos = Math.max(0, Math.min(gridSize - 1, randomPos));
    
    // Tambahkan partikel
    newHeights[dropPos] += 1;
    
    // Lakukan avalanche
    const result = performAvalanche(newHeights, false);
    
    dataRef.current.heights = result.heights;
    dataRef.current.avalanches.push(...result.avalanches);
    dataRef.current.buildingPhaseAvalanches.push(...result.avalanches);
    
    setHeights(result.heights);
    setParticlesDropped(prev => {
      const newCount = prev + 1;
      
      // Cek apakah sudah mencapai target
      if (newCount >= targetParticles && simulationPhase === 'building') {
        setIsRunning(false);
        setSimulationPhase('complete');
      }
      
      return newCount;
    });
    
    if (result.avalanches.length > 0) {
      setTotalAvalanches(prev => prev + result.avalanches.length);
      setRecentAvalanche(result.avalanches[result.avalanches.length - 1]);
      setAvalancheData(prev => [...prev, ...result.avalanches]);
      
      setTimeout(() => setRecentAvalanche(null), 500);
    }
  };

// Fungsi untuk gangguan sekunder
const applyDisturbance = () => {
  console.log('🌧️ applyDisturbance() called - Type:', disturbanceType, 'Intensity:', disturbanceIntensity);

  const newHeights = [...dataRef.current.heights];
  let modified = false;
  const newDisturbancePoints = [];
  const erosionFactor = disturbanceIntensity * 0.5; // Define erosionFactor
  
  // Tentukan jumlah titik gangguan berdasarkan intensitas
  const numPoints = Math.floor(disturbanceIntensity / 2) + 1;
  
  for (let n = 0; n < numPoints; n++) {
    let disturbancePos;

    if (!isRandomDisturbance) {
      // Mode manual: gunakan posisi yang ditentukan user
      let targetPos = Math.floor((manualDisturbancePos / 100) * gridSize);
      
      // Auto-adjust: cari material terdekat jika posisi target kosong
      if (newHeights[targetPos] < 0.5) {
        // Cari ke kiri dan kanan
        let found = false;
        for (let offset = 1; offset < 20; offset++) {
          if (targetPos - offset >= 0 && newHeights[targetPos - offset] > 0.5) {
            targetPos = targetPos - offset;
            found = true;
            break;
          }
          if (targetPos + offset < gridSize && newHeights[targetPos + offset] > 0.5) {
            targetPos = targetPos + offset;
            found = true;
            break;
          }
        }
      }
      
      disturbancePos = targetPos;
    } else if (disturbanceType === 'rain') {
      // Hujan: acak di seluruh permukaan
      disturbancePos = Math.floor(Math.random() * gridSize);
    } else if (disturbanceType === 'impact') {
      // Tumbukan: fokus di area dengan ketinggian tinggi
      const highAreas = [];
      const avgHeight = newHeights.reduce((a, b) => a + b, 0) / newHeights.length;
      for (let i = 0; i < newHeights.length; i++) {
        if (newHeights[i] > avgHeight * 0.7) {
          highAreas.push(i);
        }
      }
      disturbancePos = highAreas.length > 0 
        ? highAreas[Math.floor(Math.random() * highAreas.length)]
        : Math.floor(Math.random() * gridSize);
    } else { // vibration
      // Getaran: sepanjang lereng
      disturbancePos = Math.floor(Math.random() * gridSize);
    }
    
    // Aplikasikan gangguan
    const hasNearbyMaterial = disturbancePos > 0 && disturbancePos < gridSize - 1 && 
      (newHeights[disturbancePos] > 0 || newHeights[disturbancePos - 1] > 0 || newHeights[disturbancePos + 1] > 0);

    if (hasNearbyMaterial || newHeights[disturbancePos] > 0) {
      
      if (disturbanceType === 'rain') {
        // HUJAN: Splash erosion + lubrikasi
        // 1. Abrasi lokal (terbentuk kawah kecil)
        const splashErosion = erosionFactor * (0.8 + Math.random() * 0.4); // variasi realistis
        newHeights[disturbancePos] = Math.max(0, newHeights[disturbancePos] - splashErosion);
        
        // 2. Material tererosi tersebar ke sekitar (runoff)
        const redistributedMaterial = splashErosion * 0.6; // 40% hilang (terbawa air)
        if (disturbancePos > 0) {
          newHeights[disturbancePos - 1] += redistributedMaterial * 0.3;
        }
        if (disturbancePos < gridSize - 1) {
          newHeights[disturbancePos + 1] += redistributedMaterial * 0.3;
        }
        // Sebagian turun ke dasar
        const lowerPos = Math.max(0, disturbancePos - Math.floor(2 + Math.random() * 3));
        newHeights[lowerPos] += redistributedMaterial * 0.4;
        
        // 3. Kurangi sudut kritis lokal (efek lubrikasi)
        // Ini akan dipicu saat avalanche check
        
      } else if (disturbanceType === 'impact') {
        // TUMBUKAN: Kawah besar dengan ejeksi material
        const impactDepth = erosionFactor * 1.5;
        const ejectedMaterial = newHeights[disturbancePos] * 0.4; // 40% material terpental
        
        // Buat kawah
        newHeights[disturbancePos] = Math.max(0, newHeights[disturbancePos] - impactDepth);
        
        // Material terpental ke area sekitar (seperti meteor impact)
        for (let i = -3; i <= 3; i++) {
          if (i === 0) continue;
          const pos = disturbancePos + i;
          if (pos >= 0 && pos < gridSize) {
            const distance = Math.abs(i);
            newHeights[pos] += ejectedMaterial * (1 / distance) * 0.15;
          }
        }
        
        // Guncangan di sekitar impact
        if (disturbancePos > 0) {
          newHeights[disturbancePos - 1] -= erosionFactor * 0.4;
        }
        if (disturbancePos < gridSize - 1) {
          newHeights[disturbancePos + 1] -= erosionFactor * 0.4;
        }
        
      } else { // vibration
        // GETARAN: Destabilisasi tanpa abrasi langsung
        // Getaran menyebabkan partikel "mengendur" dan turun
        const vibrationRange = 4;
        for (let i = -vibrationRange; i <= vibrationRange; i++) {
          const pos = disturbancePos + i;
          if (pos >= 0 && pos < gridSize && newHeights[pos] > 0) {
            const distance = Math.abs(i);
            const settlingEffect = erosionFactor * 0.3 * (1 - distance / vibrationRange);
            
            // Material "turun" karena getaran (compaction + sliding)
            newHeights[pos] -= settlingEffect;
            
            // Material turun ke grid lebih rendah
            const lowerNeighbor = pos < gridSize / 2 ? pos - 1 : pos + 1;
            if (lowerNeighbor >= 0 && lowerNeighbor < gridSize) {
              newHeights[lowerNeighbor] += settlingEffect * 0.6;
            }
          }
        }
      }

      // TAMBAHKAN INI DI SINI (SETELAH PENUTUP else vibration)
      modified = true;
      newDisturbancePoints.push({ position: disturbancePos, age: 0 });
    }
  }
    
    if (modified) {
      // Catat event gangguan
      dataRef.current.disturbanceEvents.push({
        time: Date.now(),
        type: disturbanceType,
        intensity: disturbanceIntensity,
        count: disturbanceCount + 1
      });
      
      // Lakukan avalanche dari gangguan
      const result = performAvalanche(newHeights, true);
      
      dataRef.current.heights = result.heights;
      dataRef.current.avalanches.push(...result.avalanches);
      dataRef.current.disturbancePhaseAvalanches.push(...result.avalanches);
      
      setHeights(result.heights);
      setDisturbanceCount(prev => prev + 1);
      setDisturbancePoints(newDisturbancePoints);
      
      // Update efek visual
      setTimeout(() => {
        setDisturbancePoints(prev => 
          prev.map(p => ({ ...p, age: p.age + 1 })).filter(p => p.age < 5)
        );
      }, 100);
      
      if (result.avalanches.length > 0) {
        setTotalAvalanches(prev => prev + result.avalanches.length);
        setRecentAvalanche(result.avalanches[result.avalanches.length - 1]);
        setAvalancheData(prev => [...prev, ...result.avalanches]);
        
        setTimeout(() => setRecentAvalanche(null), 500);
      }
    }
  };

  // Loop simulasi pembentukan
  useEffect(() => {
    if (isRunning && simulationPhase === 'building') {
      animationRef.current = setInterval(() => {
        dropParticle();
      }, 1000 / speed);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isRunning, speed, simulationPhase]);

  // Loop gangguan sekunder
  useEffect(() => {
    if (isDisturbanceActive && simulationPhase === 'disturbance') {
      disturbanceRef.current = setInterval(() => {
  applyDisturbance();
  }, Math.max(200, 1000 / disturbanceIntensity)); // Min 200ms, lebih cepat
    } else {
      if (disturbanceRef.current) {
        clearInterval(disturbanceRef.current);
      }
    }
    
    return () => {
      if (disturbanceRef.current) {
        clearInterval(disturbanceRef.current);
      }
    };
  }, [isDisturbanceActive, simulationPhase, disturbanceIntensity, disturbanceType]);

  // Fungsi untuk menghitung sudut repose
  const calculateReposeAngle = () => {
    const h = dataRef.current.heights;
    const maxHeight = Math.max(...h);
    const maxIndex = h.indexOf(maxHeight);
    
    if (maxHeight === 0) return 0;
    
    let leftSlope = 0, rightSlope = 0;
    
    for (let i = maxIndex - 1; i >= 0; i--) {
      if (h[i] < maxHeight * 0.1) {
        leftSlope = Math.atan((maxHeight - h[i]) / (maxIndex - i)) * 180 / Math.PI;
        break;
      }
    }
    
    for (let i = maxIndex + 1; i < h.length; i++) {
      if (h[i] < maxHeight * 0.1) {
        rightSlope = Math.atan((maxHeight - h[i]) / (i - maxIndex)) * 180 / Math.PI;
        break;
      }
    }
    
    return ((leftSlope + rightSlope) / 2).toFixed(2);
  };

  // Fungsi untuk theoretical angle of repose
  const getTheoreticalReposeAngle = () => {
    const material = materials[materialType];
    return material.criticalAngle;
  };

  // Fungsi untuk mengekspor data
  const exportData = () => {
    const h = dataRef.current.heights;
    const allAvalanches = dataRef.current.avalanches;
    const buildingAvalanches = dataRef.current.buildingPhaseAvalanches;
    const disturbanceAvalanches = dataRef.current.disturbancePhaseAvalanches;
    const disturbanceEvents = dataRef.current.disturbanceEvents;
    
    // Data profil timbunan
    let profileCSV = "Posisi,Tinggi\n";
    h.forEach((height, index) => {
      profileCSV += `${index},${height.toFixed(4)}\n`;
    });
    
    // Data longsoran (semua)
    let avalancheCSV = "No,Posisi,Ukuran,Waktu,Fase,Material,Dari_Gangguan,Tipe_Gangguan,Intensitas_Gangguan\n";
allAvalanches.forEach((av, index) => {
  avalancheCSV += `${index + 1},${av.position},${av.size},${av.time},${av.phase || 'building'},${av.material || materialType},${av.fromDisturbance ? 'Ya' : 'Tidak'},${av.disturbanceType || '-'},${av.disturbanceIntensity || '-'}\n`;
});
    
    // Data event gangguan
    let disturbanceCSV = "No,Waktu,Tipe,Intensitas\n";
    disturbanceEvents.forEach((event, index) => {
      disturbanceCSV += `${index + 1},${event.time},${event.type},${event.intensity}\n`;
    });
    
    // Analisis statistik
    const material = materials[materialType];
    const reposeAngle = calculateReposeAngle();
    const maxHeight = Math.max(...h);
    const baseWidth = h.filter(x => x > 0.1).length;
    const aspectRatio = maxHeight / baseWidth;
    
    const buildingAvalancheSizes = buildingAvalanches.map(a => a.size);
    const disturbanceAvalancheSizes = disturbanceAvalanches.map(a => a.size);
    
    const avgBuildingSize = buildingAvalancheSizes.length > 0 
      ? (buildingAvalancheSizes.reduce((a, b) => a + b, 0) / buildingAvalancheSizes.length).toFixed(2)
      : 0;
      
    const avgDisturbanceSize = disturbanceAvalancheSizes.length > 0 
      ? (disturbanceAvalancheSizes.reduce((a, b) => a + b, 0) / disturbanceAvalancheSizes.length).toFixed(2)
      : 0;
    
    let summaryCSV = "Parameter,Nilai\n";
    summaryCSV += `Material,${material.name}\n`;
    summaryCSV += `Tipe Granular,${isUniform ? 'Seragam' : 'Tidak Seragam'}\n`;
    summaryCSV += `Densitas (g/cm³),${material.density}\n`;
    summaryCSV += `Kohesi,${material.cohesion}\n`;
    summaryCSV += `Sudut Kritis (°),${criticalAngle}\n`;
    summaryCSV += `Sudut Repose (°),${reposeAngle}\n`;
    summaryCSV += `Target Partikel,${targetParticles}\n`;
    summaryCSV += `Jumlah Partikel,${particlesDropped}\n`;
    summaryCSV += `Tinggi Maksimum,${maxHeight.toFixed(2)}\n`;
    summaryCSV += `Lebar Dasar,${baseWidth}\n`;
    summaryCSV += `Rasio Aspek (H/L),${aspectRatio.toFixed(4)}\n`;
    summaryCSV += `\n`;
    summaryCSV += `=== FASE PEMBENTUKAN ===\n`;
    summaryCSV += `Total Longsoran Pembentukan,${buildingAvalanches.length}\n`;
    summaryCSV += `Ukuran Longsoran Rata-rata,${avgBuildingSize}\n`;
    summaryCSV += `\n`;
    summaryCSV += `=== FASE GANGGUAN ===\n`;
    summaryCSV += `Tipe Gangguan,${disturbanceType}\n`;
    summaryCSV += `Jumlah Event Gangguan,${disturbanceEvents.length}\n`;
    summaryCSV += `Total Longsoran Gangguan,${disturbanceAvalanches.length}\n`;
    summaryCSV += `Ukuran Longsoran Gangguan Rata-rata,${avgDisturbanceSize}\n`;
    summaryCSV += `Perbandingan Longsoran (Gangguan/Pembentukan),${disturbanceAvalanches.length > 0 ? (disturbanceAvalanches.length / Math.max(buildingAvalanches.length, 1)).toFixed(2) : 0}\n`;
    
    // Gabungkan dan download
    const fullCSV = "=== RINGKASAN SIMULASI ===\n" + summaryCSV + 
                    "\n=== PROFIL TIMBUNAN ===\n" + profileCSV +
                    "\n=== DATA SEMUA LONGSORAN ===\n" + avalancheCSV +
                    "\n=== DATA EVENT GANGGUAN ===\n" + disturbanceCSV;
    
    const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulasi_avalanche_${materialType}_${isUniform ? 'uniform' : 'nonuniform'}_${Date.now()}.csv`;
    a.click();
  };

  // Reset simulasi
  const resetSimulation = () => {
    setIsRunning(false);
    // Reset Grid dan Data
    setHeights(new Array(gridSize).fill(0));
    setParticlesDropped(0);
    setTotalAvalanches(0);
    setAvalancheData([]);
    setRecentAvalanche(null);
    setDisturbancePoints([]);
    
    // Reset State Gangguan
    setIsDisturbanceActive(false);
    setDisturbanceCount(0);
    
    // PENTING: Kembalikan fase ke 'building' agar menu material muncul lagi
    setSimulationPhase('building'); 
  };

  // Mulai fase gangguan
  const startDisturbancePhase = () => {
    setSimulationPhase('disturbance');
    setIsDisturbanceActive(true);
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white p-4 flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Simulasi Timbunan Partikel Granular dengan Gangguan Sekunder</h1>
        <p className="text-sm text-gray-400">Model Longsor: Pembentukan Timbunan → Gangguan Eksternal (Hujan/Tumbukan)</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Visualisasi */}
        <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-full bg-gray-900 rounded"
          />
        </div>

        {/* Panel Kontrol & Statistik */}
        <div className="w-96 flex flex-col gap-4 overflow-y-auto">
          {/* Pengaturan Material */}
          {showSettings && simulationPhase === 'building' && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Settings size={18} />
                Pengaturan Material
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Jenis Material
                  </label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded"
                    disabled={particlesDropped > 0}
                  >
                    {Object.entries(materials).map(([key, mat]) => (
                      <option key={key} value={key}>{mat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Tipe Granular
                  </label>
                  <select
                    value={isUniform ? 'uniform' : 'nonuniform'}
                    onChange={(e) => setIsUniform(e.target.value === 'uniform')}
                    className="w-full px-3 py-2 bg-gray-700 rounded"
                    disabled={particlesDropped > 0}
                  >
                    <option value="uniform">Seragam (Uniform)</option>
                    <option value="nonuniform">Tidak Seragam (Non-uniform)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {isUniform ? 'Sudut kritis konstan' : 'Sudut kritis bervariasi'}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Target Partikel (N): {targetParticles}
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={targetParticles}
                    onChange={(e) => setTargetParticles(Number(e.target.value))}
                    className="w-full"
                    disabled={particlesDropped > 0}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Simulasi akan berhenti otomatis saat mencapai N partikel
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Info Material:</p>
                  <div className="text-xs space-y-1">
                    <p>• Densitas: {materials[materialType].density} g/cm³</p>
                    <p>• Kohesi: {materials[materialType].cohesion}</p>
                    <p>• Variasi: ±{materials[materialType].variance}°</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kontrol Pembentukan */}
          {simulationPhase === 'building' && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-bold mb-3">Fase Pembentukan Timbunan</h3>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex-1 px-4 py-2 rounded flex items-center justify-center gap-2 ${
                    isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
                </button>
                
                <button
                  onClick={resetSimulation}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Kecepatan: {speed}x
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="bg-gray-700 rounded p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress:</span>
                    <span className="font-mono">{particlesDropped} / {targetParticles}</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(particlesDropped / targetParticles) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kontrol Gangguan Sekunder */}
          {simulationPhase === 'complete' && (
            <div className="bg-gradient-to-br from-orange-900 to-red-900 rounded-lg p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Droplets size={18} />
                Fase Gangguan Sekunder
              </h3>
              
              <p className="text-sm text-gray-300 mb-4">
                Timbunan telah terbentuk! Simulasikan gangguan eksternal seperti hujan atau tumbukan.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Jenis Gangguan
                  </label>
                  <select
                    value={disturbanceType}
                    onChange={(e) => setDisturbanceType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded"
                  >
                    <option value="rain">🌧️ Hujan (Rain)</option>
                    <option value="impact">💥 Tumbukan Benda (Impact)</option>
                    <option value="vibration">🌊 Getaran (Vibration)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Intensitas: {disturbanceIntensity}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={disturbanceIntensity}
                    onChange={(e) => setDisturbanceIntensity(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {disturbanceIntensity <= 3 ? 'Ringan' : disturbanceIntensity <= 6 ? 'Sedang' : 'Berat'}
                  </p>
                </div>

                <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Mode Gangguan
                </label>
                <select
                  value={isRandomDisturbance ? 'random' : 'manual'}
                  onChange={(e) => setIsRandomDisturbance(e.target.value === 'random')}
                  className="w-full px-3 py-2 bg-gray-700 rounded"
                >
                  <option value="random">🎲 Acak (Random)</option>
                  <option value="manual">🎯 Manual (Fixed Position)</option>
                </select>
              </div>

              {!isRandomDisturbance && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Posisi Gangguan: {manualDisturbancePos}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={manualDisturbancePos}
                    onChange={(e) => setManualDisturbancePos(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Simulasi abrasi/erosi pada lokasi spesifik
                  </p>
                </div>
              )}

                <button
                  onClick={startDisturbancePhase}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center gap-2 font-bold"
                >
                  <Zap size={18} />
                  Mulai Gangguan Sekunder
                </button>

                <div className="text-xs text-gray-400 bg-gray-800 rounded p-2">
                  <p className="font-bold mb-1">Penjelasan:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Hujan:</strong> Menambah berat pada titik acak</li>
                    <li><strong>Tumbukan:</strong> Impact kuat di area tinggi</li>
                    <li><strong>Getaran:</strong> Propagasi energi sepanjang lereng</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Kontrol saat Gangguan Aktif */}
          {simulationPhase === 'disturbance' && (
            <div className="bg-red-900 rounded-lg p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                {disturbanceType === 'rain' ? <Droplets size={18} /> : <Zap size={18} />}
                Gangguan Aktif
              </h3>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setIsDisturbanceActive(!isDisturbanceActive)}
                  className={`flex-1 px-4 py-2 rounded flex items-center justify-center gap-2 ${
                    isDisturbanceActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isDisturbanceActive ? <><Pause size={16} /> Stop</> : <><Play size={16} /> Resume</>}
                </button>
                
                <button
                  onClick={() => setSimulationPhase('complete')}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                >
                  Kembali
                </button>

                <button
                onClick={resetSimulation}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded flex items-center gap-2"
                title="Reset seluruh simulasi"
              >
                <RotateCcw size={16} />
                Reset
                </button>
              </div>

              <div className="bg-gray-800 rounded p-3 mb-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Event Gangguan:</span>
                    <span className="font-mono font-bold">{disturbanceCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Longsoran Baru:</span>
                    <span className="font-mono font-bold text-red-400">
                      {dataRef.current.disturbancePhaseAvalanches.length}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Intensitas: {disturbanceIntensity}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={disturbanceIntensity}
                  onChange={(e) => setDisturbanceIntensity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Statistik Real-time */}
          <div className="bg-gray-800 rounded-lg p-4 flex-1 overflow-auto">
            <h3 className="font-bold mb-3">Statistik Real-time</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Material:</span>
                <span className="font-mono">{materials[materialType].name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Tipe:</span>
                <span className="font-mono">{isUniform ? 'Seragam' : 'Tidak Seragam'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Partikel:</span>
                <span className="font-mono font-bold">{particlesDropped}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Total Longsoran:</span>
                <span className="font-mono font-bold text-yellow-400">{totalAvalanches}</span>
              </div>

              {simulationPhase !== 'building' && (
                <>
                  <hr className="border-gray-700 my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-400">Longsoran (Build):</span>
                    <span className="font-mono text-blue-400">
                      {dataRef.current.buildingPhaseAvalanches.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Longsoran (Gangguan):</span>
                    <span className="font-mono text-red-400">
                      {dataRef.current.disturbancePhaseAvalanches.length}
                    </span>
                  </div>
                </>
              )}
              
              <hr className="border-gray-700 my-2" />
              
              <div className="flex justify-between">
                <span className="text-gray-400">Tinggi Maks:</span>
                <span className="font-mono font-bold">{Math.max(...heights, 0).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Sudut Repose:</span>
                <span className="font-mono font-bold text-green-400">
                  {calculateReposeAngle()}°
                </span>
              </div>

              <div className="flex justify-between">
              <span className="text-gray-400">Sudut Repose (Teori):</span>
              <span className="font-mono font-bold text-purple-400">
                {getTheoreticalReposeAngle()}°
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Selisih (Θᵣ - Teori):</span>
              <span className="font-mono font-bold text-orange-400">
                {(parseFloat(calculateReposeAngle()) - getTheoreticalReposeAngle()).toFixed(2)}°
              </span>
            </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Rasio H/L:</span>
                <span className="font-mono font-bold">
                  {(Math.max(...heights, 0) / Math.max(heights.filter(x => x > 0.1).length, 1)).toFixed(4)}
                </span>
              </div>

              {avalancheData.length > 0 && (
                <>
                  <hr className="border-gray-700 my-3" />
                  <div className="text-xs">
                    <p className="text-gray-400 mb-2">Longsoran Terakhir (5):</p>
                    <div className="space-y-1">
                      {avalancheData.slice(-5).reverse().map((av, idx) => (
                        <div key={idx} className={`flex justify-between ${av.fromDisturbance ? 'text-red-300' : 'text-gray-300'}`}>
                          <span>Pos: {av.position}</span>
                          <span>Size: {av.size}</span>
                          <span>{av.fromDisturbance ? '🌧️' : '⚪'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tombol Export */}
          <button
            onClick={exportData}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg p-3 flex items-center justify-center gap-2 font-bold"
          >
            <Download size={18} />
            Download Data (CSV)
          </button>

          {/* Informasi */}
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
            <p>💡 <strong>Alur Simulasi:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-1">
              <li>Pilih material dan tipe granular</li>
              <li>Set target N partikel</li>
              <li>Jalankan fase pembentukan</li>
              <li>Setelah N tercapai, pilih jenis gangguan</li>
              <li>Pilih mode: Random atau Manual (abrasi)</li>
              <li>Simulasikan longsor sekunder</li>
              <li>Bisa reset kapan saja untuk coba ulang</li>
              <li>Download CSV untuk analisis</li>
            </ol>
            <p className="mt-3 text-xs">
              <strong>📍 Mode Manual:</strong> Simulasi abrasi/erosi pada lokasi tetap (contoh: tebing sungai, lereng jalan)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = GranularAvalancheSimulation;
export default App;