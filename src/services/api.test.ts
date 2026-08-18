import { isSafeExternalUrl, resolveMediaUrl } from './api';

/**
 * `resolveMediaUrl` and `isSafeExternalUrl` are the boundary that stops a
 * server-supplied string from reaching an image loader or a browser. The URLs
 * come from scraped agency sites, so they are the least trustworthy data the
 * app handles.
 */

describe('isSafeExternalUrl', () => {
  it('accepts http and https', () => {
    expect(isSafeExternalUrl('https://example.org/a')).toBe(true);
    expect(isSafeExternalUrl('http://example.org/a')).toBe(true);
  });

  it('rejects javascript: and data: URLs', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects custom app schemes, which could trigger a deep link', () => {
    expect(isSafeExternalUrl('kosherpass://products/1')).toBe(false);
    expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects empty and unparseable values', () => {
    expect(isSafeExternalUrl(null)).toBe(false);
    expect(isSafeExternalUrl(undefined)).toBe(false);
    expect(isSafeExternalUrl('')).toBe(false);
    expect(isSafeExternalUrl('not a url')).toBe(false);
  });

  it('ignores surrounding whitespace rather than being fooled by it', () => {
    expect(isSafeExternalUrl('  https://example.org  ')).toBe(true);
    expect(isSafeExternalUrl('  javascript:alert(1)  ')).toBe(false);
  });
});

describe('resolveMediaUrl', () => {
  it('resolves a relative path against the API base', () => {
    expect(resolveMediaUrl('/img/1.png')).toBe('http://test.local/img/1.png');
  });

  it('passes an absolute http(s) URL through unchanged', () => {
    expect(resolveMediaUrl('https://cdn.example.org/1.png')).toBe(
      'https://cdn.example.org/1.png'
    );
  });

  it('returns null for an unsafe scheme so the caller falls back to its placeholder', () => {
    expect(resolveMediaUrl('javascript:alert(1)')).toBeNull();
    expect(resolveMediaUrl('data:image/png;base64,AAAA')).toBeNull();
  });

  it('returns null for absent or blank values', () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl(undefined)).toBeNull();
    expect(resolveMediaUrl('   ')).toBeNull();
  });
});
