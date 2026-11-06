// Native image links remain usable without JavaScript. Zoom stays inside the viewer.
(() => {
  const dialog = document.querySelector('.paper-image-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = dialog.querySelector('[data-image-full]');
  const stage = dialog.querySelector('.paper-image-stage');
  const viewport = dialog.querySelector('.paper-image-viewport');
  const caption = dialog.querySelector('.paper-image-caption');
  const sizeButton = dialog.querySelector('[data-image-size]');
  const zoomLabel = dialog.querySelector('[data-image-zoom]');
  const loading = dialog.querySelector('[data-image-loading]');
  const error = dialog.querySelector('[data-image-error]');
  let opener, savedBodyStyle, scale = 1, fitScale = 1, pointerStart;

  const padding = () => innerWidth <= 640 ? 12 : 18;
  const fit = () => {
    // Measure the available window without scrollbars left by a previous zoom.
    const wasHidden = stage.hidden;
    stage.hidden = true;
    const result = Math.min(1,
      Math.max(1, viewport.clientWidth - padding() * 2) / image.naturalWidth,
      Math.max(1, viewport.clientHeight - padding() * 2) / image.naturalHeight);
    stage.hidden = wasHidden;
    return result;
  };
  const centerAnchor = () => {
    const box = image.getBoundingClientRect(), bounds = viewport.getBoundingClientRect();
    return {x: viewport.clientWidth / 2, y: viewport.clientHeight / 2,
      nx: (bounds.left + viewport.clientWidth / 2 - box.left) / scale,
      ny: (bounds.top + viewport.clientHeight / 2 - box.top) / scale};
  };
  function renderScale(next, anchor) {
    scale = Math.min(4, Math.max(fitScale, next));
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    const sw = Math.max(viewport.clientWidth, w + padding() * 2);
    // Width can introduce a horizontal scrollbar. Read height after that layout
    // change so a wide, short figure does not acquire a redundant vertical bar.
    stage.style.width = sw + 'px';
    Object.assign(image.style, {width: w + 'px', height: h + 'px'});
    const sh = Math.max(viewport.clientHeight, h + padding() * 2);
    const x = (sw - w) / 2, y = (sh - h) / 2;
    stage.style.height = sh + 'px';
    Object.assign(image.style, {left: x + 'px', top: y + 'px'});
    const zoomed = scale > fitScale + .001;
    dialog.classList.toggle('is-image-zoomed', zoomed);
    sizeButton.textContent = zoomed ? '适应窗口' : '原始尺寸';
    sizeButton.setAttribute('aria-pressed', String(zoomed));
    zoomLabel.textContent = Math.round(scale * 100) + '%';
    if (anchor) {
      viewport.scrollLeft = x + anchor.nx * scale - anchor.x;
      viewport.scrollTop = y + anchor.ny * scale - anchor.y;
    } else {
      viewport.scrollLeft = viewport.scrollTop = 0;
    }
  }
  image.addEventListener('load', () => {
    if (!dialog.open) return;
    loading.hidden = true;
    stage.hidden = false;
    sizeButton.disabled = false;
    viewport.setAttribute('aria-busy', 'false');
    fitScale = fit();
    renderScale(fitScale);
  });
  image.addEventListener('error', () => {
    if (!dialog.open) return;
    loading.hidden = true;
    error.hidden = false;
    viewport.setAttribute('aria-busy', 'false');
  });
  document.querySelectorAll('.work-figure > a, .archive-paper-figure > a, .research-detail-figure > a').forEach(link => {
    link.classList.add('paper-image-link');
    link.setAttribute('aria-haspopup', 'dialog');
    link.title = '点击放大论文图示';
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const thumbnail = link.querySelector('img');
      if (!thumbnail) return;
      event.preventDefault();
      opener = link;
      caption.textContent = link.closest('article')?.querySelector('h3')?.textContent
        || document.querySelector('.research-detail h1')?.textContent || thumbnail.alt;
      image.alt = thumbnail.alt;
      stage.hidden = true;
      loading.hidden = false;
      error.hidden = true;
      sizeButton.disabled = true;
      zoomLabel.textContent = '';
      viewport.setAttribute('aria-busy', 'true');
      dialog.querySelector('[data-image-original]').href = link.href;
      const gap = innerWidth - document.documentElement.clientWidth;
      savedBodyStyle = {overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight};
      document.body.style.paddingRight = (parseFloat(getComputedStyle(document.body).paddingRight) || 0) + gap + 'px';
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      image.src = link.href;
    });
  });
  viewport.addEventListener('wheel', event => {
    if (stage.hidden || !image.naturalWidth || !event.deltaY) return;
    event.preventDefault();
    const box = image.getBoundingClientRect(), bounds = viewport.getBoundingClientRect();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
    const delta = Math.max(-120, Math.min(120, event.deltaY * unit));
    const anchor = {x: event.clientX - bounds.left, y: event.clientY - bounds.top,
      nx: (event.clientX - box.left) / scale, ny: (event.clientY - box.top) / scale};
    renderScale(scale * Math.exp(-delta * .002), anchor);
  }, {passive: false});
  viewport.addEventListener('keydown', event => {
    if (stage.hidden) return;
    if (event.key === '+' || event.key === '=' || event.key === '-') {
      event.preventDefault();
      renderScale(scale * (event.key === '-' ? 1 / 1.2 : 1.2), centerAnchor());
    } else if (event.key === '0') {
      event.preventDefault();
      renderScale(fitScale);
    }
  });
  viewport.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) { pointerStart = null; return; }
    if (![image, stage, viewport].includes(event.target)) return;
    pointerStart = {id: event.pointerId, x: event.clientX, y: event.clientY,
      left: viewport.scrollLeft, top: viewport.scrollTop};
    if (event.pointerType === 'mouse' && scale > fitScale + .001) viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', event => {
    if (!pointerStart || pointerStart.id !== event.pointerId || event.pointerType !== 'mouse') return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
    if (Math.hypot(dx, dy) > 6 && scale > fitScale + .001) {
      viewport.scrollLeft = pointerStart.left - dx;
      viewport.scrollTop = pointerStart.top - dy;
    }
  });
  viewport.addEventListener('pointercancel', () => { pointerStart = null; });
  viewport.addEventListener('pointerup', event => {
    const start = pointerStart;
    pointerStart = null;
    if (!start || start.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6;
    const scrolled = Math.abs(viewport.scrollTop - start.top) + Math.abs(viewport.scrollLeft - start.left) > 2;
    if (!moved && !scrolled && [image, stage, viewport].includes(event.target)) dialog.close();
  });
  sizeButton.addEventListener('click', () => renderScale(scale > fitScale + .001 ? fitScale : 1, centerAnchor()));
  dialog.querySelector('[data-image-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    pointerStart = null;
    document.body.style.overflow = savedBodyStyle.overflow;
    document.body.style.paddingRight = savedBodyStyle.paddingRight;
    image.removeAttribute('src');
    stage.hidden = true;
    opener?.focus({preventScroll: true});
  });
  window.addEventListener('resize', () => {
    if (!dialog.open || stage.hidden) return;
    const wasFit = Math.abs(scale - fitScale) < .001, anchor = centerAnchor();
    fitScale = fit();
    renderScale(wasFit ? fitScale : scale, wasFit ? null : anchor);
  });
})();
