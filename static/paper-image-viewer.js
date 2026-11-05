// Keep the original image links as a fallback and preserve the reader's place.
(() => {
  const dialog = document.querySelector('.paper-image-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const links = document.querySelectorAll('.work-figure > a, .archive-paper-figure > a, .research-detail-figure > a');
  const image = dialog.querySelector('[data-image-full]');
  const caption = dialog.querySelector('.paper-image-caption');
  const viewport = dialog.querySelector('.paper-image-viewport');
  const sizeButton = dialog.querySelector('[data-image-size]');
  const loading = dialog.querySelector('[data-image-loading]');
  const error = dialog.querySelector('[data-image-error]');
  let opener;
  let savedBodyStyle;

  const setOriginalSize = (original) => {
    dialog.classList.toggle('is-original-size', original);
    sizeButton.setAttribute('aria-pressed', String(original));
    sizeButton.textContent = original ? '适应窗口' : '原始尺寸';
    viewport.scrollTo({top: 0, left: 0, behavior: 'instant'});
  };
  image.addEventListener('load', () => {
    if (!dialog.open) return;
    loading.hidden = true;
    image.hidden = false;
    sizeButton.disabled = false;
    viewport.setAttribute('aria-busy', 'false');
  });
  image.addEventListener('error', () => {
    if (!dialog.open) return;
    loading.hidden = true;
    error.hidden = false;
    viewport.setAttribute('aria-busy', 'false');
  });

  links.forEach((link) => {
    link.classList.add('paper-image-link');
    link.setAttribute('aria-haspopup', 'dialog');
    link.title = '点击放大论文图示';
    const openImage = (trigger) => {
      const thumbnail = link.querySelector('img');
      if (!thumbnail) return;
      opener = trigger;
      const paper = link.closest('article');
      caption.textContent = paper?.querySelector('h3')?.textContent || document.querySelector('.research-detail h1')?.textContent || thumbnail.alt;
      image.alt = thumbnail.alt;
      image.hidden = true;
      loading.hidden = false;
      error.hidden = true;
      sizeButton.disabled = true;
      viewport.setAttribute('aria-busy', 'true');
      dialog.querySelector('[data-image-original]').href = link.href;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      savedBodyStyle = {overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight};
      const padding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = padding + scrollbarWidth + 'px';
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      setOriginalSize(false);
      image.src = link.href;
    };
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openImage(link);
    });
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'paper-image-open';
    button.textContent = '查看大图';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', '放大查看：' + (link.querySelector('img')?.alt || '论文图示'));
    button.addEventListener('click', () => openImage(button));
    const workActions = link.closest('.featured-work')?.querySelector('.work-links');
    if (workActions) {
      workActions.append(button);
    } else {
      const tools = document.createElement('div');
      tools.className = 'paper-image-tools';
      tools.append(button);
      link.after(tools);
    }
  });

  sizeButton.addEventListener('click', () => setOriginalSize(sizeButton.getAttribute('aria-pressed') !== 'true'));
  dialog.querySelector('[data-image-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = savedBodyStyle.overflow;
    document.body.style.paddingRight = savedBodyStyle.paddingRight;
    image.removeAttribute('src');
    opener?.focus({preventScroll: true});
  });
})();
