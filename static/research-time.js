(function (root) {
  'use strict';
  const shanghaiDay = () => {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const value = (type) => parts.find((part) => part.type === type).value;
    return `${value('year')}-${value('month')}-${value('day')}`;
  };
  const isWithinLastYear = (publishedFrom, today = shanghaiDay()) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedFrom || '')) return false;
    const value = Date.parse(`${publishedFrom}T00:00:00Z`);
    const now = Date.parse(`${today}T00:00:00Z`);
    if (!Number.isFinite(value) || !Number.isFinite(now)
      || new Date(value).toISOString().slice(0, 10) !== publishedFrom) return false;
    return value >= now - 365 * 86400000 && value <= now;
  };
  const api = { shanghaiDay, isWithinLastYear };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.McsipResearchDates = api;
})(typeof window !== 'undefined' ? window : {});
