const ALLOWED_TAGS = new Set([
  'B',
  'BR',
  'EM',
  'I',
  'LI',
  'OL',
  'P',
  'S',
  'STRONG',
  'U',
  'UL',
  'A',
]);

/**
 * Keep rich-text metadata inert and intentionally small. This is used both
 * when importing an EPUB and while accepting content from contentEditable.
 */
export function sanitizeHtml(value: string): string {
  if (typeof DOMParser === 'undefined') {
    return value
      .replace(/<\s*(script|style|iframe|object|embed|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
      .replace(/<(?!\/?(?:b|br|em|i|li|ol|p|s|strong|u|ul|a)(?:\s|\/?>))[^>]*>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript\s*:/gi, '');
  }

  const document = new DOMParser().parseFromString(`<div>${value}</div>`, 'text/html');
  const root = document.body.firstElementChild;
  if (!root) return '';

  for (const element of Array.from(root.querySelectorAll('*'))) {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const safeHref = name === 'href' && /^(https?:|mailto:)/i.test(attribute.value.trim());
      if (name !== 'href' || !safeHref || element.tagName !== 'A') {
        element.removeAttribute(attribute.name);
      }
    }
  }
  return root.innerHTML;
}
