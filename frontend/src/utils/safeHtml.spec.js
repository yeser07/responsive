import { describe, expect, it } from 'vitest';
import { escapeHtml, messagesToSafeHtml } from './safeHtml';

describe('safeHtml', () => {
  it('escapes html entities', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('builds safe list html', () => {
    expect(messagesToSafeHtml(['a <b>'])).toContain('&lt;b&gt;');
  });
});
