const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
  const closeNavigation = (restoreFocus = false) => {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '打开导航');
    if (restoreFocus) navToggle.focus();
  };

  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? '关闭导航' : '打开导航');
  });
  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeNavigation());
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && siteNav.classList.contains('open')) closeNavigation(true);
  });
  document.addEventListener('click', (event) => {
    if (!siteNav.contains(event.target) && !navToggle.contains(event.target)) closeNavigation();
  });

  window.addEventListener('resize', () => {
    if (getComputedStyle(navToggle).display === 'none') closeNavigation();
  });
}

document.querySelectorAll('.recent-publications').forEach((section) => {
  const region = section.querySelector('[data-recent-scroll]');
  if (!region) return;
  const allRows = [...region.querySelectorAll('.publication-row')];
  let reviewedDay;
  const refreshWindow = () => {
    const dates = window.McsipResearchDates;
    if (!dates) return;
    const today = dates.shanghaiDay();
    if (today === reviewedDay) return;
    reviewedDay = today;
    allRows.forEach((row) => { row.hidden = !dates.isWithinLastYear(row.dataset.publishedFrom, today); });
    const count = allRows.filter((row) => !row.hidden).length;
    region.setAttribute('aria-label', '近一年 ' + count + ' 篇论文');
    const label = section.querySelector('[data-recent-count]');
    if (label) label.textContent = String(count);
    const empty = section.querySelector('[data-recent-empty]');
    if (empty) empty.hidden = count > 0;
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshWindow(); });
  window.setInterval(refreshWindow, 3600000);
  refreshWindow();
});
