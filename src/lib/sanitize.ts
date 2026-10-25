import DOMPurify from 'dompurify';

const IFRAME_ALLOW = /^https:\/\/(www\.)?(youtube(-nocookie)?\.com|player\.vimeo\.com)\//;

// Registered once on the shared instance: lazy-load images, never leak the referrer,
// and drop any iframe that is not on the allowlist.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IMG') {
    node.setAttribute('loading', 'lazy');
    node.setAttribute('referrerpolicy', 'no-referrer');
  }
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
    node.setAttribute('target', '_blank');
  }
  if (node.tagName === 'IFRAME') {
    if (!IFRAME_ALLOW.test(node.getAttribute('src') ?? '')) node.remove();
    else node.setAttribute('referrerpolicy', 'no-referrer');
  }
});

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'loading', 'referrerpolicy', 'target'],
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'object', 'embed'],
    FORBID_ATTR: ['style', 'srcset'],
  });
}

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}
