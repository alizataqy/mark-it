# Mark It - YouTube Bookmark & Screen Time (Chrome Extension)

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

1. Buka browser **Google Chrome**.
2. Masuk ke halaman ekstensi dengan mengetik `chrome://extensions` di address bar.
3. Aktifkan toggle **Developer mode** di pojok kanan atas.
4. Klik tombol **Load unpacked** di pojok kiri atas.
5. Pilih folder:
   ```text
   C:\dev\yt-bookmark-screentime
   ```
6. Ekstensi sudah aktif. Refresh tab YouTube yang terbuka untuk menggunakannya.

---

## Struktur File Project

```text
yt-bookmark-screentime/
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
