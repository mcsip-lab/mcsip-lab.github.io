/* Search the published catalog locally; the website does not require a server. */
(() => {
  const dataElement = document.getElementById('publication-search-data');
  if (!dataElement) return;
  const form = document.querySelector('.publication-search');
  const list = document.querySelector('.publication-archive .publication-list');
  const heading = document.querySelector('.search-results-heading');
  const queryInput = document.getElementById('paper-query');
  const yearInput = document.getElementById('paper-year');
  const kindInput = document.getElementById('paper-kind');
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase();
  const entries = JSON.parse(dataElement.textContent).map(item => ({
    ...item, search: normalize(item.search), row: document.getElementById(`paper-${item.id}`),
  }));
  const pageSize = 10;
  const pagination = document.createElement('nav');
  pagination.className = 'pagination';
  pagination.setAttribute('aria-label', '论文分页');
  list.after(pagination);
  const empty = document.createElement('div');
  empty.className = 'search-empty';
  const emptyTitle = document.createElement('h2');
  emptyTitle.textContent = '没有找到匹配的论文';
  const emptyCopy = document.createElement('p');
  emptyCopy.textContent = '试试更短的关键词，或选择其他年份。';
  empty.append(emptyTitle, emptyCopy);
  list.append(empty);
  let state;

  function readState() {
    const params = new URLSearchParams(location.search);
    const year = params.get('year') || '';
    const kind = params.get('kind') || '';
    return {
      q: (params.get('q') || '').trim().slice(0, 200),
      year: [...yearInput.options].some(option => option.value === year) ? year : '',
      kind: [...kindInput.options].some(option => option.value === kind) ? kind : '',
      page: Math.max(1, Number.parseInt(params.get('page'), 10) || 1),
    };
  }

  function stateUrl(next) {
    const url = new URL(form.action, location.href);
    if (next.q) url.searchParams.set('q', next.q);
    if (next.year) url.searchParams.set('year', next.year);
    if (next.kind) url.searchParams.set('kind', next.kind);
    if (next.page > 1) url.searchParams.set('page', next.page);
    return url;
  }

  function navigate(next, focusResults = true) {
    state = next;
    render();
    history.pushState({}, '', stateUrl(state));
    if (focusResults) heading.scrollIntoView({ block: 'start' });
  }

  function pageLink(label, page, disabled = false, current = false) {
    const element = document.createElement(disabled || current ? 'span' : 'a');
    element.textContent = label;
    if (disabled) element.className = 'disabled';
    if (current) {
      element.className = 'current';
      element.setAttribute('aria-current', 'page');
    }
    if (!disabled && !current) {
      element.href = stateUrl({ ...state, page });
      element.addEventListener('click', event => {
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate({ ...state, page });
      });
    }
    return element;
  }

  function render() {
    queryInput.value = state.q;
    yearInput.value = state.year;
    kindInput.value = state.kind;
    const query = normalize(state.q);
    const matches = entries.filter(item => (!query || item.search.includes(query))
      && (!state.year || String(item.year) === state.year)
      && (!state.kind || item.kind === state.kind));
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    state.page = Math.min(state.page, pageCount);
    const visible = new Set(matches.slice((state.page - 1) * pageSize, state.page * pageSize));
    entries.forEach(item => { item.row.style.display = visible.has(item) ? '' : 'none'; });
    empty.style.display = matches.length ? 'none' : '';

    const status = document.createElement('p');
    const count = document.createElement('strong');
    count.textContent = matches.length;
    const filtered = state.q || state.year || state.kind;
    status.append(filtered ? '找到 ' : '全部 ', count, ' 篇论文');
    heading.replaceChildren(status);
    if (filtered) {
      const clear = document.createElement('a');
      clear.className = 'text-link';
      clear.textContent = '清除筛选 ×';
      clear.href = form.action;
      clear.addEventListener('click', event => {
        event.preventDefault();
        navigate({ q: '', year: '', kind: '', page: 1 });
      });
      heading.append(clear);
    }
    pagination.replaceChildren();
    pagination.style.display = pageCount > 1 ? '' : 'none';
    if (pageCount > 1) {
      pagination.append(pageLink('← 上一页', state.page - 1, state.page === 1));
      const pages = document.createElement('div');
      for (let page = 1; page <= pageCount; page++) pages.append(pageLink(String(page), page, false, state.page === page));
      pagination.append(pages, pageLink('下一页 →', state.page + 1, state.page === pageCount));
    }
  }

  function search(event) {
    event?.preventDefault();
    navigate({ q: queryInput.value.trim().slice(0, 200), year: yearInput.value, kind: kindInput.value, page: 1 });
  }
  form.addEventListener('submit', search);
  yearInput.addEventListener('change', search);
  kindInput.addEventListener('change', search);
  window.addEventListener('popstate', () => { state = readState(); render(); });
  state = readState();
  render();
})();
