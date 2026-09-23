// Background Service Worker
chrome.commands.onCommand.addListener((command) => {
  if (command === 'bookmark-timestamp') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      if (activeTab && activeTab.id && activeTab.url && activeTab.url.includes('youtube.com/watch')) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'TRIGGER_BOOKMARK' });
      }
    });
  }
});
