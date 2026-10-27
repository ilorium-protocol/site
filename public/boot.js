/*
 * Loaded as a blocking, same-origin script in <head> (no inline JS: strict CSP).
 * 1. Applies a saved theme before first paint.
 * 2. Marks the document as "js" so reveal-on-scroll styles can apply.
 * 3. Adds .in to [data-rv] blocks when they scroll into view (instantly when reduced motion is on).
 */
(function () {
  var root = document.documentElement;
  try {
    var t = localStorage.getItem('ilorium-theme');
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t);
  } catch (e) {}
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduced || !('IntersectionObserver' in window)) return; // no "js" class: everything stays fully drawn
  root.classList.add('js');
  function start() {
    var els = document.querySelectorAll('[data-rv]');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
    // Safety net: never leave content hidden.
    setTimeout(function () { els.forEach(function (el) { el.classList.add('in'); }); }, 8000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
