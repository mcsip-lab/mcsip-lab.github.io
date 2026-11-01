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
    let active = sections[0];
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
  updateActiveSection();
}
