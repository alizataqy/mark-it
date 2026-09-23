# Mark It (Chrome Extension)

Ekstensi Google Chrome (Manifest V3) tanpa dependensi eksternal untuk mencatat bookmark timestamp video YouTube, menandai langsung di timeline player, dan memantau screen time (waktu tonton aktif) dengan grafik interaktif.

## Fitur Utama

1. **Bookmark Timestamp**:
   - Tombol bookmark terintegrasi di kontrol player YouTube.
   - Shortcut keyboard: **`Alt + B`** (atau `MacCtrl + B` di Mac).
   - Tombol bookmark cepat langsung dari popup ekstensi.
   - **Timeline Marker**: Indikator penanda bookmark hitam langsung di progress bar YouTube yang dapat diklik untuk melompat ke timestamp.
   - **Kartu Video Akordeon**: Daftar video dapat dibuka dan ditutup (expand/collapse).
   - **Navigasi Cepat**: Seluruh baris timestamp dapat diklik untuk melompat langsung ke detik video terkait.
   - **Modal Konfirmasi Custom**: Dialog konfirmasi bertema gelap sebelum menghapus timestamp atau video.

2. **Screen Time & Watch Time Tracker**:
   - Pelacakan waktu aktif presisi: hanya menghitung saat video diputar (`play`) dan tab aktif (jeda / `pause` dan background tab tidak dihitung).
   - **Line Chart Interaktif**: Grafik garis SVG dengan area gradien dan hover tooltip detik/menit detail.
   - **Filter Fleksibel**: 24 Jam Terakhir, 7 Hari Terakhir, 30 Hari Terakhir, dan Semua Riwayat.
   - Opsi reset data statistik tontonan.

---

## Cara Install di Google Chrome

1. Download atau clone repository proyek **Mark It** ke komputer Anda.
2. Buka browser **Google Chrome** (atau browser berbasis Chromium seperti Brave, Edge, Opera).
3. Masuk ke halaman pengelolaan ekstensi:
   - Ketik `chrome://extensions` pada kolom URL / address bar lalu tekan Enter, atau
   - Klik menu titik tiga di pojok kanan atas > **Extensions** > **Manage Extensions**.
4. Aktifkan toggle **Developer mode** (Mode pengembang) di pojok kanan atas.
5. Klik tombol **Load unpacked** (Muat yang belum dibongkar) di pojok kiri atas.
6. Pilih folder root proyek **Mark It** tempat file `manifest.json` berada.
7. Ekstensi **Mark It** siap digunakan. Buka atau muat ulang (refresh) tab YouTube untuk mulai menikmati fiturnya.

---

## Struktur File Project

```text
mark-it/
├── background.js              # Service worker shortcut Alt+B
├── manifest.json              # Konfigurasi Chrome Extension Manifest V3
├── README.md                  # Dokumentasi proyek
├── content/
│   ├── content.css            # Styling marker timeline hitam, tombol player & toast
│   └── content.js             # Logika bookmark, timeline markers & tracker waktu tonton
├── icons/                     # Aset icon ekstensi
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── popup/
    ├── popup.css              # Dark theme styling, modal dialog, akordeon & line chart
    ├── popup.html             # Markup popup yang aksesibel (WCAG 2.1 AA)
    └── popup.js               # Render bookmark, jumping link, SVG line chart & modal
```
