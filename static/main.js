// Keep one copy of the detailed research content in the active reading order.
(() => {
  const intro = document.querySelector('.academic-home .intro-copy');
  const tasks = intro?.querySelector('.research-task-overview');
  const summary = intro?.querySelector('.intro-mobile-overview');
  const details = document.querySelector('.home-research-details');
  if (!tasks || !summary || !details) return;
  const narrow = window.matchMedia('(max-width:980px)');
  const syncResearchOrder = () => {
    const target = narrow.matches ? details : intro;
    if (tasks.parentElement !== target) target.append(tasks);
    summary.hidden = !narrow.matches;
    details.hidden = !narrow.matches;
  };
  syncResearchOrder();
  narrow.addEventListener('change', syncResearchOrder);
  summary.querySelector('.intro-work-link')?.addEventListener('click', () => {
    const target = document.getElementById('selected-work');
    if (!target) return;
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
    const pageInset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    target.style.scrollMarginTop = Math.max(0, headerHeight + 16 - pageInset) + 'px';
  });
})();

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
    position.textContent = '共 ' + rows.length + ' 篇';
  };
  const browse = (direction) => {
    const rows = allRows.filter((row) => !row.hidden);
    if (!rows.length) return;
    const bounds = region.getBoundingClientRect();
    const first = rows.findIndex((row) => row.getBoundingClientRect().bottom > bounds.top + 2);
    if (first < 0) return;
    const target = rows[Math.max(0, Math.min(rows.length - 1, first + direction * 2))];
    const targetDistance = target.getBoundingClientRect().top - bounds.top;
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
    const screenBudget = Math.max(1,
      Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, headerHeight));
    const maxStep = Math.min(region.clientHeight, screenBudget) * .8;
    // Advance about two papers, retaining overlap when entries or the column are tall.
    const distance = targetDistance * direction > 2 ? Math.abs(targetDistance) : maxStep;
    region.scrollBy({
      top: direction * Math.min(distance, maxStep),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };
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

document.querySelectorAll('.home-news').forEach((section) => {
  const region = section.querySelector('[data-news-window]');
  const list = region?.querySelector('.news-list');
  if (!list) return;
  const rows = [...list.querySelectorAll('.news-entry')];
  const controls = section.querySelector('[data-news-controls]');
  const previous = controls?.querySelector('[data-news-up]');
  const next = controls?.querySelector('[data-news-down]');
  const updateButtons = () => {
    previous.disabled = region.scrollTop <= 2;
    next.disabled = region.scrollTop + region.clientHeight >= region.scrollHeight - 2;
  };
  const fitThreeRows = () => {
    const visible = rows.filter(row => !row.hidden);
    const overflow = visible.length > 3;
    controls.hidden = !overflow;
    if (overflow) {
      // Measure the real first three entries, including wrapped mobile text.
      const first = visible[0].getBoundingClientRect();
      const third = visible[2].getBoundingClientRect();
      const height = Math.ceil(third.bottom - first.top + 4);
      region.style.height = height + 'px';
    } else {
      region.style.height = 'auto';
    }
    updateButtons();
  };
  const refreshNews = () => {
    const dates = window.McsipResearchDates;
    const today = dates?.shanghaiDay();
    rows.forEach(row => {
      const published = row.dataset.newsPublishedFrom;
      if (published && dates) {
        row.hidden = !dates.isWithinLastYear(published, today);
      }
    });
    fitThreeRows();
  };
  const browse = direction => region.scrollBy({
    top: direction * region.clientHeight,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
  previous?.addEventListener('click', () => browse(-1));
  next?.addEventListener('click', () => browse(1));
  region.addEventListener('scroll', updateButtons, {passive: true});
  window.addEventListener('resize', fitThreeRows);
  if ('ResizeObserver' in window) new ResizeObserver(fitThreeRows).observe(list);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshNews(); });
  window.setInterval(refreshNews, 3600000);
  refreshNews();
});
