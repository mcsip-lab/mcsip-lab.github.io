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

  const links = [...siteNav.querySelectorAll('a[href^="#"]')];
  const sections = links.map((link) => ({
    link, section: document.getElementById(link.hash.slice(1)),
  })).filter((item) => item.section);
  let pendingNavigationUpdate = false;
  const updateActiveSection = () => {
    const header = document.querySelector('.site-header');
    const headerBox = header.getBoundingClientRect();
    const sideNavigation = getComputedStyle(header).position === 'fixed'
      && headerBox.width < window.innerWidth / 2;
    const reviewHeight = document.querySelector('.design-review-bar')?.offsetHeight || 0;
    const headerHeight = sideNavigation ? reviewHeight : header.offsetHeight + reviewHeight;
    let active = null;
    let nearestTop = -Infinity;
    sections.forEach((item) => {
      const top = item.section.getBoundingClientRect().top;
      const sameRow = Math.abs(top - nearestTop) <= 1;
      if (top <= headerHeight + 42
        && (top > nearestTop + 1 || (sameRow && item.link.hash === window.location.hash))) {
        active = item;
        nearestTop = top;
      }
    });
    const lastSection = sections[sections.length - 1];
    if (lastSection && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      && lastSection.section.getBoundingClientRect().top < window.innerHeight) {
      active = lastSection;
    }
    links.forEach((link) => {
      if (active && link === active.link) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    pendingNavigationUpdate = false;
  };
  window.addEventListener('scroll', () => {
    if (!pendingNavigationUpdate) {
      pendingNavigationUpdate = true;
      window.requestAnimationFrame(updateActiveSection);
    }
  }, { passive: true });
  window.addEventListener('resize', () => {
    if (getComputedStyle(navToggle).display === 'none') closeNavigation();
    updateActiveSection();
  });
  window.addEventListener('hashchange', updateActiveSection);
  updateActiveSection();
}

document.querySelectorAll('.recent-publications').forEach((section) => {
  const viewport = section.querySelector('[data-recent-scroll]');
  const controls = section.querySelector('[data-recent-controls]');
  if (!viewport || !controls) return;
  const previous = controls.querySelector('[data-recent-up]');
  const next = controls.querySelector('[data-recent-down]');
  const position = controls.querySelector('[data-recent-position]');
  const allRows = [...viewport.querySelectorAll('.publication-row')];
  let rows = allRows;
  const update = () => {
    const bounds = viewport.getBoundingClientRect();
    const visible = rows.map((row, index) => ({ bounds: row.getBoundingClientRect(), index }))
      .filter((row) => row.bounds.bottom > bounds.top + 8 && row.bounds.top < bounds.bottom - 8);
    controls.hidden = viewport.scrollHeight <= viewport.clientHeight + 2;
    previous.disabled = viewport.scrollTop <= 2;
    next.disabled = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2;
    const label = visible.length
      ? `${visible[0].index + 1}–${visible[visible.length - 1].index + 1} / ${rows.length} 篇`
      : `${rows.length} 篇`;
    if (position.textContent !== label) position.textContent = label;
  };
  const browse = (direction) => viewport.scrollBy({
    top: direction * viewport.clientHeight * .82,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
  previous.addEventListener('click', () => browse(-1));
  next.addEventListener('click', () => browse(1));
  viewport.addEventListener('scroll', update, { passive: true });
  viewport.addEventListener('toggle', update, true);
  window.addEventListener('resize', update);
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(viewport.querySelector('.publication-list'));
  let reviewedDay;
  const refreshWindow = () => {
    const dates = window.McsipResearchDates;
    if (!dates) { update(); return; }
    const today = dates.shanghaiDay();
    if (today === reviewedDay) return;
    reviewedDay = today;
    allRows.forEach((row) => { row.hidden = !dates.isWithinLastYear(row.dataset.publishedFrom, today); });
    rows = allRows.filter((row) => !row.hidden);
    viewport.setAttribute('aria-label', `近一年 ${rows.length} 篇论文`);
    const empty = section.querySelector('[data-recent-empty]');
    if (empty) empty.hidden = rows.length > 0;
    update();
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshWindow(); });
  window.setInterval(refreshWindow, 3600000);
  refreshWindow();
});
