# 🏔️ Simulasi Timbunan Granular & Analisis Longsoran (Granular Avalanche)

![Netlify Status](https://api.netlify.com/api/v1/badges/b7a2e5df-7c8e-4a8e-9c2e-4e8e9c2e4e8e/deploy-status) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73C92?style=for-the-badge&logo=vite&logoColor=white)

**Live Demo:** [https://genuine-tapioca-cf8f51.netlify.app](https://genuine-tapioca-cf8f51.netlify.app)

---

## 📖 Deskripsi Proyek

Aplikasi ini adalah simulasi berbasis web untuk memodelkan fenomena **Dinamika Material Granular** (pasir, beras, manik kaca) menggunakan pendekatan *1D Cellular Automata* (model *Sandpile*).

Proyek ini dikembangkan sebagai bagian dari tugas **Research Based Learning (RBL) - Pemodelan & Analisis Data Fisika**. Simulasi ini bertujuan untuk:
1. Memvisualisasikan pembentukan timbunan granular dan fenomena **Sudut Repose** (*Angle of Repose*).
2. Menganalisis mekanisme **Longsoran (Avalanche)** akibat ketidakstabilan lokal.
3. Mempelajari dampak gangguan eksternal (Hujan/Erosi & Gempa) terhadap kestabilan tumpukan.
4. Membuktikan fenomena *Self-Organized Criticality* (SOC) melalui distribusi data longsoran.

---

## ✨ Fitur Utama

### 1. Simulasi Fisika Granular
* **Multi-Material:** Pilihan material (Pasir, Beras, Manik Kaca, Campuran) dengan *critical angle* yang berbeda.
* **Fase Simulasi:** * *Building Phase:* Penjatuhan partikel secara stokhastik untuk membentuk tumpukan awal.
    * *Disturbance Phase:* Pemberian gangguan sekunder setelah tumpukan stabil.
* **Visualisasi Real-time:** Grafik tumpukan interaktif dengan penanda visual (ikon 🌧️) untuk longsoran akibat gangguan.

### 2. Mode Gangguan (Disturbance)
* **Hujan (Rain/Erosion):** Memodelkan efek abrasi air yang mengurangi energi ikat partikel (erosi ketinggian).
* **Gempa (Quake):** Memodelkan getaran yang menurunkan ambang batas kestabilan (*threshold*) secara acak di berbagai titik.
* **Kontrol Posisi:** * *Random:* Gangguan terjadi di posisi acak.
    * *Manual:* Slider untuk memfokuskan gangguan pada titik tertentu (misal: hanya menggerus puncak).

### 3. Pengambilan Data (Data Generator)
* **Ekspor CSV Lengkap:** Data hasil simulasi dapat diunduh dalam format `.csv` yang mencakup:
    * `Step` (Waktu)
    * `Posisi` (Lokasi longsor)
    * `Ukuran_Longsor` (Jumlah massa yang pindah)
    * `Tipe_Gangguan` & `Intensitas` (Untuk analisis korelasi).

---

## 🛠️ Teknologi yang Digunakan

* **Frontend Framework:** [React.js](https://react.dev/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)

---

## 🚀 Cara Menjalankan di Lokal (Localhost)

Jika Anda ingin menjalankan atau memodifikasi kode ini di komputer Anda sendiri:

1.  **Clone Repository**
    ```bash
    git clone [https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git](https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git)
    cd NAMA_REPO_ANDA
    ```

2.  **Install Dependencies**
    Pastikan Anda sudah menginstall [Node.js](https://nodejs.org/).
    ```bash
    npm install
    ```

3.  **Jalankan Server Development**
    ```bash
    npm run dev
    ```

4.  **Buka di Browser**
    Akses `http://localhost:5173` (atau port lain yang muncul di terminal).

---

## 📊 Panduan Pengambilan Data (Untuk Laporan)

Untuk mendapatkan data yang valid bagi analisis fisika (Hukum Pangkat / *Power Law*), disarankan mengikuti langkah berikut:

1.  **Set Parameter Awal:** Pilih material (misal: Pasir) dan set target partikel (misal: 2000).
2.  **Fase Pembentukan:** Klik tombol **Play** dan tunggu hingga partikel habis terjatuh (Fase Building selesai).
3.  **Fase Gangguan:**
    * Pilih jenis gangguan (misal: Hujan).
    * Atur intensitas (1-10).
    * Klik **Simulasi Gangguan** beberapa kali untuk mendapatkan variasi data.
4.  **Ekspor:** Klik tombol **Download Data (CSV)**.
5.  **Analisis:** Gunakan Python/Excel untuk memplot grafik *Log-Log* antara `Ukuran Longsor` vs `Frekuensi`.

---

## 👥 Anggota Kelompok

* **Muhammad Fauzan Adhiima** 10222005
* **Kansha Ghaffaru Firmansyah** 10222017
* **Rifki Nugraha** 10222025
* **Athallah Afiq Slamet** 10222072

---

> Dibuat untuk memenuhi Tugas Mata Kuliah Pemodelan, Generator Data, dan Analisis (PGDA).
