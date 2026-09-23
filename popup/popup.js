(() => {
  'use strict';

  // --- Elements ---
  const tabBtnBookmarks = document.getElementById('tab-btn-bookmarks');
  const tabBtnStats = document.getElementById('tab-btn-stats');
  const bookmarksView = document.getElementById('bookmarks-view');
  const statsView = document.getElementById('stats-view');

  const bookmarksContainer = document.getElementById('bookmarks-container');
  const bookmarksEmpty = document.getElementById('bookmarks-empty');
  const btnQuickBm = document.getElementById('btn-quick-bm');

  const todayTimeEl = document.getElementById('today-time');
  const rangeTotalEl = document.getElementById('range-total');
  const chartRangeTitleEl = document.getElementById('chart-range-title');
  const lineChartSvg = document.getElementById('line-chart-svg');
  const chartTooltip = document.getElementById('chart-tooltip');
  const btnResetStats = document.getElementById('btn-reset-stats');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Modal elements
  const confirmModal = document.getElementById('confirm-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalBtnCancel = document.getElementById('modal-btn-cancel');
  const modalBtnConfirm = document.getElementById('modal-btn-confirm');
  let onModalConfirmCallback = null;

  function showConfirmModal(title, message, onConfirm) {
    modalTitle.textContent = title || 'Konfirmasi Hapus';
    modalMessage.textContent = message || 'Apakah Anda yakin ingin menghapus item ini?';
    onModalConfirmCallback = onConfirm;
    confirmModal.classList.add('show');
    confirmModal.setAttribute('aria-hidden', 'false');
    modalBtnConfirm.focus();
  }

  function hideConfirmModal() {
    confirmModal.classList.remove('show');
    confirmModal.setAttribute('aria-hidden', 'true');
    onModalConfirmCallback = null;
  }

  modalBtnCancel.addEventListener('click', hideConfirmModal);
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) hideConfirmModal();
  });
  modalBtnConfirm.addEventListener('click', () => {
    if (typeof onModalConfirmCallback === 'function') {
      onModalConfirmCallback();
    }
    hideConfirmModal();
  });

  let currentRange = '24h';

  // --- Tab Navigation ---
  tabBtnBookmarks.addEventListener('click', () => {
    tabBtnBookmarks.classList.add('active');
    tabBtnBookmarks.setAttribute('aria-selected', 'true');
    tabBtnStats.classList.remove('active');
    tabBtnStats.setAttribute('aria-selected', 'false');
    bookmarksView.classList.add('active');
    statsView.classList.remove('active');
    loadBookmarks();
  });

  tabBtnStats.addEventListener('click', () => {
    tabBtnStats.classList.add('active');
    tabBtnStats.setAttribute('aria-selected', 'true');
    tabBtnBookmarks.classList.remove('active');
    tabBtnBookmarks.setAttribute('aria-selected', 'false');
    statsView.classList.add('active');
    bookmarksView.classList.remove('active');
    loadStats();
  });

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.dataset.range;
      loadStats();
    });
  });

  // --- Quick Bookmark Button ---
  btnQuickBm.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'TRIGGER_BOOKMARK' }, () => {
          setTimeout(loadBookmarks, 400);
        });
      }
    });
  });

  // --- Helper Date & Time ---
  function getTodayKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDuration(totalSeconds) {
    const sec = Math.floor(totalSeconds || 0);
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs}j ${mins}m ${secs}d`;
  }

  function formatShortDuration(totalSeconds) {
    const sec = Math.floor(totalSeconds || 0);
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hrs}j ${mins}m`;
  }

  // --- Bookmarks Logic ---
  async function loadBookmarks() {
    try {
      const data = await chrome.storage.local.get('yt_bookmarks');
      const bookmarksMap = data.yt_bookmarks || {};
      const videoIds = Object.keys(bookmarksMap);

      bookmarksContainer.innerHTML = '';
      if (videoIds.length === 0) {
        bookmarksEmpty.style.display = 'flex';
        return;
      }
      bookmarksEmpty.style.display = 'none';

      videoIds.forEach((vid) => {
        const item = bookmarksMap[vid];
        if (!item || !item.bookmarks || item.bookmarks.length === 0) return;

        const card = document.createElement('div');
        card.className = 'video-card';

        // Card Header (Accordion toggle)
        const header = document.createElement('div');
        header.className = 'video-card-header';
        header.title = 'Klik untuk buka/tutup daftar bookmark';

        const arrow = document.createElement('div');
        arrow.className = 'accordion-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        `;

        const thumb = document.createElement('img');
        thumb.className = 'video-thumb';
        thumb.src = item.thumbnail || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
        thumb.alt = 'Thumbnail';

        const info = document.createElement('div');
        info.className = 'video-info';

        const title = document.createElement('div');
        title.className = 'video-title';
        title.textContent = item.title || 'YouTube Video';
        title.title = item.title || '';
        info.appendChild(title);

        const btnDelVideo = document.createElement('button');
        btnDelVideo.className = 'btn-icon-del';
        btnDelVideo.title = 'Hapus semua bookmark video ini';
        btnDelVideo.setAttribute('aria-label', `Hapus semua bookmark untuk ${item.title || 'video ini'}`);
        btnDelVideo.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        `;
        btnDelVideo.addEventListener('click', (e) => {
          e.stopPropagation();
          showConfirmModal(
            'Hapus Semua Bookmark',
            `Apakah Anda yakin ingin menghapus semua bookmark untuk "${item.title || 'video ini'}"?`,
            async () => {
              delete bookmarksMap[vid];
              await chrome.storage.local.set({ yt_bookmarks: bookmarksMap });
              loadBookmarks();
            }
          );
        });

        // Toggle accordion on header click
        header.addEventListener('click', () => {
          card.classList.toggle('collapsed');
        });

        header.appendChild(arrow);
        header.appendChild(thumb);
        header.appendChild(info);
        header.appendChild(btnDelVideo);
        card.appendChild(header);

        // Timestamps container
        const tsContainer = document.createElement('div');
        tsContainer.className = 'timestamps-container';

        item.bookmarks.forEach((bm) => {
          const row = document.createElement('div');
          row.className = 'timestamp-row';
          row.title = `Lompat ke ${bm.formattedTime}`;
          row.setAttribute('role', 'button');
          row.setAttribute('tabindex', '0');
          row.setAttribute('aria-label', `Lompat ke menit ${bm.formattedTime} - ${bm.note || 'Bookmark'}`);

          const jumpToTime = () => {
            const targetUrl = `https://www.youtube.com/watch?v=${vid}&t=${Math.floor(bm.time)}s`;
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              const activeTab = tabs && tabs[0];
              if (activeTab && activeTab.url && activeTab.url.includes(vid)) {
                chrome.tabs.update(activeTab.id, { url: targetUrl });
              } else {
                chrome.tabs.create({ url: targetUrl });
              }
            });
          };

          row.addEventListener('click', jumpToTime);
          row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              jumpToTime();
            }
          });

          const chip = document.createElement('span');
          chip.className = 'timestamp-chip';
          chip.textContent = bm.formattedTime;

          const note = document.createElement('span');
          note.className = 'timestamp-note';
          note.textContent = bm.note || 'Bookmark';

          const btnDelBm = document.createElement('button');
          btnDelBm.className = 'btn-icon-del';
          btnDelBm.title = 'Hapus timestamp ini';
          btnDelBm.setAttribute('aria-label', `Hapus bookmark timestamp ${bm.formattedTime}`);
          btnDelBm.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          `;
          btnDelBm.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirmModal(
              'Hapus Bookmark',
              `Hapus timestamp ${bm.formattedTime}${bm.note ? ` ("${bm.note}")` : ''}?`,
              async () => {
                item.bookmarks = item.bookmarks.filter(b => b.id !== bm.id);
                if (item.bookmarks.length === 0) {
                  delete bookmarksMap[vid];
                }
                await chrome.storage.local.set({ yt_bookmarks: bookmarksMap });
                loadBookmarks();
              }
            );
          });

          row.appendChild(chip);
          row.appendChild(note);
          row.appendChild(btnDelBm);
          tsContainer.appendChild(row);
        });

        card.appendChild(tsContainer);
        bookmarksContainer.appendChild(card);
      });
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    }
  }

  // --- Line Chart Generator ---
  function renderSvgLineChart(points) {
    lineChartSvg.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const width = 320;
    const height = 140;
    const padX = 22;
    const padY = 24;

    if (!points || points.length === 0) return;

    let maxVal = Math.max(...points.map(p => p.val));
    if (maxVal <= 0) maxVal = 60; // 1 min fallback scale

    const stepX = (width - padX * 2) / (points.length - 1 || 1);
    const coords = points.map((p, idx) => {
      const x = padX + idx * stepX;
      const y = height - padY - (p.val / maxVal) * (height - padY * 2);
      return { x, y, label: p.label, val: p.val, tip: p.tip };
    });

    // Grid horizontal lines
    [0, 0.5, 1].forEach(ratio => {
      const gridY = height - padY - ratio * (height - padY * 2);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', padX);
      line.setAttribute('y1', gridY);
      line.setAttribute('x2', width - padX);
      line.setAttribute('y2', gridY);
      line.setAttribute('stroke', '#252525');
      line.setAttribute('stroke-dasharray', '3,3');
      lineChartSvg.appendChild(line);
    });

    // Area Fill Gradient
    const defs = document.createElementNS(svgNS, 'defs');
    const grad = document.createElementNS(svgNS, 'linearGradient');
    grad.setAttribute('id', 'areaGrad');
    grad.setAttribute('x1', '0');
    grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0');
    grad.setAttribute('y2', '1');

    const stop1 = document.createElementNS(svgNS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#3ea6ff');
    stop1.setAttribute('stop-opacity', '0.35');

    const stop2 = document.createElementNS(svgNS, 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#3ea6ff');
    stop2.setAttribute('stop-opacity', '0.0');

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    lineChartSvg.appendChild(defs);

    // Build SVG Path
    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      pathD += ` L ${coords[i].x} ${coords[i].y}`;
    }

    // Area path
    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - padY} L ${coords[0].x} ${height - padY} Z`;
    const areaPath = document.createElementNS(svgNS, 'path');
    areaPath.setAttribute('d', areaD);
    areaPath.setAttribute('fill', 'url(#areaGrad)');
    lineChartSvg.appendChild(areaPath);

    // Line Path
    const linePath = document.createElementNS(svgNS, 'path');
    linePath.setAttribute('d', pathD);
    linePath.setAttribute('fill', 'none');
    linePath.setAttribute('stroke', '#3ea6ff');
    linePath.setAttribute('stroke-width', '2.5');
    linePath.setAttribute('stroke-linecap', 'round');
    linePath.setAttribute('stroke-linejoin', 'round');
    lineChartSvg.appendChild(linePath);

    // Labels & interactive points
    // To avoid label crowding, show subset of labels
    const labelStep = points.length > 15 ? Math.ceil(points.length / 5) : (points.length > 7 ? 2 : 1);

    coords.forEach((c, idx) => {
      // Bottom axis text
      if (idx % labelStep === 0 || idx === coords.length - 1) {
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', c.x);
        text.setAttribute('y', height - 8);
        text.setAttribute('fill', '#9e9e9e');
        text.setAttribute('font-size', '9');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = c.label;
        lineChartSvg.appendChild(text);
      }

      // Point Circle
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', c.x);
      circle.setAttribute('cy', c.y);
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', '#3ea6ff');
      circle.setAttribute('stroke', '#141414');
      circle.setAttribute('stroke-width', '1.5');
      circle.style.cursor = 'pointer';

      circle.addEventListener('mouseenter', () => {
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', '#ff0033');
        chartTooltip.textContent = `${c.tip}: ${formatDuration(c.val)}`;
        chartTooltip.style.left = `${(c.x / width) * 100}%`;
        chartTooltip.style.top = `${(c.y / height) * 100}%`;
        chartTooltip.style.display = 'block';
      });

      circle.addEventListener('mouseleave', () => {
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', '#3ea6ff');
        chartTooltip.style.display = 'none';
      });

      lineChartSvg.appendChild(circle);
    });
  }

  // --- Stats Logic ---
  async function loadStats() {
    try {
      const data = await chrome.storage.local.get(['yt_watch_stats', 'yt_hourly_stats']);
      const stats = data.yt_watch_stats || {};
      const hourlyStats = data.yt_hourly_stats || {};

      const todayKey = getTodayKey();
      const todaySeconds = stats[todayKey] || 0;
      todayTimeEl.textContent = formatDuration(todaySeconds);

      let chartPoints = [];
      let totalRangeSeconds = 0;
      const now = new Date();

      if (currentRange === '24h') {
        chartRangeTitleEl.textContent = 'Aktivitas 24 Jam Terakhir';
        // Generate last 24 hours (1 hour step)
        for (let i = 23; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 3600 * 1000);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hour = String(d.getHours()).padStart(2, '0');
          const hourKey = `${year}-${month}-${day} ${hour}:00`;
          const sec = hourlyStats[hourKey] || 0;
          totalRangeSeconds += sec;

          chartPoints.push({
            label: `${hour}:00`,
            tip: hourKey,
            val: sec
          });
        }
      } else if (currentRange === '7d') {
        chartRangeTitleEl.textContent = 'Aktivitas 7 Hari Terakhir';
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          const sec = stats[dateKey] || 0;
          totalRangeSeconds += sec;

          const dayName = d.toLocaleDateString('id-ID', { weekday: 'narrow' }) || d.toLocaleDateString('en-US', { weekday: 'short' });
          chartPoints.push({
            label: dayName,
            tip: dateKey,
            val: sec
          });
        }
      } else if (currentRange === '30d') {
        chartRangeTitleEl.textContent = 'Aktivitas 30 Hari Terakhir';
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          const sec = stats[dateKey] || 0;
          totalRangeSeconds += sec;

          chartPoints.push({
            label: `${d.getDate()}/${d.getMonth() + 1}`,
            tip: dateKey,
            val: sec
          });
        }
      } else if (currentRange === 'all') {
        chartRangeTitleEl.textContent = 'Semua Riwayat Tercatat';
        const allKeys = Object.keys(stats).sort();
        if (allKeys.length === 0) {
          allKeys.push(todayKey);
        }
        allKeys.forEach(dateKey => {
          const sec = stats[dateKey] || 0;
          totalRangeSeconds += sec;
          chartPoints.push({
            label: dateKey.substring(5), // MM-DD
            tip: dateKey,
            val: sec
          });
        });
      }

      rangeTotalEl.textContent = `Total: ${formatShortDuration(totalRangeSeconds)}`;
      renderSvgLineChart(chartPoints);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  // Reset Stats Button
  btnResetStats.addEventListener('click', () => {
    showConfirmModal(
      'Reset Semua Statistik',
      'Apakah Anda yakin ingin menghapus semua data screen time dan statistik tontonan? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        await chrome.storage.local.set({ yt_watch_stats: {}, yt_hourly_stats: {} });
        loadStats();
      }
    );
  });

  // Initial load
  loadBookmarks();
})();
