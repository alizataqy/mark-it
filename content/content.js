(() => {
  'use strict';

  // --- Helpers ---
  function formatTimestamp(seconds) {
    const sec = Math.floor(seconds || 0);
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getTodayKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getHourKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:00`;
  }

  function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  function getVideoTitle() {
    const titleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1 yt-formatted-string');
    return titleEl ? titleEl.textContent.trim() : document.title.replace(' - YouTube', '').trim();
  }

  function showToast(message) {
    let toast = document.getElementById('yt-bm-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'yt-bm-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // --- Bookmark Logic ---
  async function bookmarkCurrentTime() {
    const videoId = getVideoId();
    const video = document.querySelector('video');
    if (!videoId || !video) {
      showToast('❌ Tidak ada video YouTube yang aktif');
      return;
    }

    const currentTime = video.currentTime;
    const formatted = formatTimestamp(currentTime);
    const title = getVideoTitle();
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const newBookmark = {
      id: `bm_${Date.now()}`,
      time: Math.round(currentTime * 10) / 10,
      formattedTime: formatted,
      note: '',
      createdAt: Date.now()
    };

    try {
      const data = await chrome.storage.local.get('yt_bookmarks');
      const bookmarksMap = data.yt_bookmarks || {};

      if (!bookmarksMap[videoId]) {
        bookmarksMap[videoId] = {
          title: title,
          thumbnail: thumbnail,
          bookmarks: []
        };
      } else {
        // Update title/thumbnail if needed
        bookmarksMap[videoId].title = title || bookmarksMap[videoId].title;
      }

      bookmarksMap[videoId].bookmarks.push(newBookmark);
      // Sort ascending by time
      bookmarksMap[videoId].bookmarks.sort((a, b) => a.time - b.time);

      await chrome.storage.local.set({ yt_bookmarks: bookmarksMap });
      showToast(`Bookmark tersimpan di ${formatted}`);
      renderTimelineMarkers();
    } catch (err) {
      console.error('Error saving bookmark:', err);
      showToast('Gagal menyimpan bookmark');
    }
  }

  // --- Screen Time Tracker Logic ---
  let accumulatedSeconds = 0;
  let trackerInterval = null;

  async function flushWatchTime() {
    if (accumulatedSeconds <= 0) return;
    const secondsToSave = accumulatedSeconds;
    accumulatedSeconds = 0;

    const today = getTodayKey();
    const currentHour = getHourKey();
    try {
      const data = await chrome.storage.local.get(['yt_watch_stats', 'yt_hourly_stats']);
      const stats = data.yt_watch_stats || {};
      const hourlyStats = data.yt_hourly_stats || {};

      stats[today] = (stats[today] || 0) + secondsToSave;
      hourlyStats[currentHour] = (hourlyStats[currentHour] || 0) + secondsToSave;

      // Keep hourly stats trimmed to last 48 hours to preserve storage
      const keys = Object.keys(hourlyStats);
      if (keys.length > 60) {
        keys.sort();
        while (keys.length > 48) {
          delete hourlyStats[keys.shift()];
        }
      }

      await chrome.storage.local.set({
        yt_watch_stats: stats,
        yt_hourly_stats: hourlyStats
      });
    } catch (err) {
      console.error('Error updating watch stats:', err);
    }
  }

  function startWatchTracker() {
    if (trackerInterval) return;
    trackerInterval = setInterval(() => {
      const video = document.querySelector('video');
      // Only count if video is present, not paused, not ended, and tab is visible
      if (video && !video.paused && !video.ended && document.visibilityState === 'visible') {
        accumulatedSeconds += 1;
        // Flush every 5 seconds to storage
        if (accumulatedSeconds >= 5) {
          flushWatchTime();
        }
      }
    }, 1000);
  }

  // --- Player Button Injection ---
  function injectPlayerButton() {
    if (!getVideoId()) return;
    if (document.getElementById('yt-custom-bm-btn')) return;

    const rightControls = document.querySelector('.ytp-right-controls') || document.querySelector('.ytp-left-controls');
    if (!rightControls) return;

    const btn = document.createElement('button');
    btn.id = 'yt-custom-bm-btn';
    btn.className = 'ytp-button yt-bm-player-btn';
    btn.title = 'Bookmark Timestamp (Alt+B)';
    btn.innerHTML = `
      <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
        <path fill="#fff" d="M12 8c-1.1 0-2 .9-2 2v18l8-4 8 4V10c0-1.1-.9-2-2-2H12zm0 2h12v15.2l-6-3-6 3V10z"></path>
      </svg>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      bookmarkCurrentTime();
    });

    rightControls.prepend(btn);
  }

  // --- Timeline Markers on YouTube Progress Bar ---
  async function renderTimelineMarkers() {
    const videoId = getVideoId();
    const video = document.querySelector('video');
    const progressBar = document.querySelector('.ytp-progress-bar-container, .ytp-progress-bar');
    if (!videoId || !video || !progressBar || isNaN(video.duration) || video.duration <= 0) return;

    // Clear existing markers
    document.querySelectorAll('.yt-bm-timeline-marker').forEach(el => el.remove());

    try {
      const data = await chrome.storage.local.get('yt_bookmarks');
      const bookmarksMap = data.yt_bookmarks || {};
      const videoData = bookmarksMap[videoId];
      if (!videoData || !videoData.bookmarks || videoData.bookmarks.length === 0) return;

      const duration = video.duration;

      videoData.bookmarks.forEach((bm) => {
        const percent = Math.min(100, Math.max(0, (bm.time / duration) * 100));
        const marker = document.createElement('div');
        marker.className = 'yt-bm-timeline-marker';
        marker.style.left = `${percent}%`;
        marker.title = `Bookmark: ${bm.formattedTime}${bm.note ? ` - ${bm.note}` : ''}`;

        marker.addEventListener('click', (e) => {
          e.stopPropagation();
          video.currentTime = bm.time;
          showToast(`Lompat ke bookmark: ${bm.formattedTime}`);
        });

        progressBar.appendChild(marker);
      });
    } catch (err) {
      console.error('Error rendering timeline markers:', err);
    }
  }

  // --- Event Listeners & Lifecycle ---
  window.addEventListener('keydown', (e) => {
    // Shortcut Alt+B
    if (e.altKey && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      bookmarkCurrentTime();
    }
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'TRIGGER_BOOKMARK') {
      bookmarkCurrentTime();
    }
  });

  // Watch for storage changes (e.g. if deleted from popup)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.yt_bookmarks) {
      renderTimelineMarkers();
    }
  });

  // Watch for page transitions (YouTube SPA)
  window.addEventListener('yt-navigate-finish', () => {
    setTimeout(() => {
      injectPlayerButton();
      renderTimelineMarkers();
    }, 1000);
  });

  // Save on tab switch or close
  window.addEventListener('beforeunload', () => {
    flushWatchTime();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushWatchTime();
    }
  });

  // Init
  startWatchTracker();
  setTimeout(() => {
    injectPlayerButton();
    renderTimelineMarkers();
  }, 1500);

  // When video metadata is loaded, calculate marker positions accurately
  const attachVideoEvents = () => {
    const video = document.querySelector('video');
    if (video) {
      video.addEventListener('loadedmetadata', renderTimelineMarkers);
      video.addEventListener('durationchange', renderTimelineMarkers);
    }
  };
  attachVideoEvents();

  // Fallback observer in case player controls or progress bar load late
  const observer = new MutationObserver(() => {
    if (getVideoId()) {
      if (!document.getElementById('yt-custom-bm-btn')) {
        injectPlayerButton();
      }
      if (document.querySelectorAll('.yt-bm-timeline-marker').length === 0) {
        renderTimelineMarkers();
        attachVideoEvents();
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
