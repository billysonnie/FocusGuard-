document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('stats', (result) => {
    const stats = result.stats;
    if (stats) {
      // Today
      document.getElementById('ads-today').textContent = stats.adsBlocked.today;
      document.getElementById('cookies-today').textContent = stats.cookiesSkipped.today;
      document.getElementById('distractions-today').textContent = stats.distractionsBlocked.today;

      // This Week
      document.getElementById('ads-week').textContent = stats.adsBlocked.currentWeek;
      document.getElementById('cookies-week').textContent = stats.cookiesSkipped.currentWeek;
      document.getElementById('distractions-week').textContent = stats.distractionsBlocked.currentWeek;

      // All Time
      document.getElementById('ads-total').textContent = stats.adsBlocked.total;
      document.getElementById('cookies-total').textContent = stats.cookiesSkipped.total;
      document.getElementById('distractions-total').textContent = stats.distractionsBlocked.total;
    }
  });
});
