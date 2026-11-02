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
  const controls = section.querySelector('[data-recent-controls]');
  const previous = controls?.querySelector('[data-recent-up]');
  const next = controls?.querySelector('[data-recent-down]');
  const position = controls?.querySelector('[data-recent-position]');
  const updateBrowse = () => {
    if (!controls) return;
    const overflow = region.scrollHeight > region.clientHeight + 2;
    controls.hidden = !overflow;
    previous.disabled = region.scrollTop <= 2;
    next.disabled = region.scrollTop + region.clientHeight >= region.scrollHeight - 2;
    const rows = allRows.filter((row) => !row.hidden);
    const bounds = region.getBoundingClientRect();
    const visible = rows.map((row, index) => ({index, box: row.getBoundingClientRect()}))
      .filter(({box}) => box.bottom > bounds.top + 6 && box.top < bounds.bottom - 6);
    position.textContent = visible.length
      ? (visible[0].index + 1) + '–' + (visible[visible.length - 1].index + 1) + ' / ' + rows.length + ' 篇'
      : rows.length + ' 篇';
  };
  const browse = (direction) => region.scrollBy({
    top: direction * region.clientHeight * .75,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
  previous?.addEventListener('click', () => browse(-1));
  next?.addEventListener('click', () => browse(1));
  region.addEventListener('scroll', updateBrowse, {passive: true});
  window.addEventListener('resize', updateBrowse);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(updateBrowse);
    observer.observe(region);
    observer.observe(region.querySelector('.publication-list'));
  }
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
    updateBrowse();
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshWindow(); });
  window.setInterval(refreshWindow, 3600000);
  refreshWindow();
});
