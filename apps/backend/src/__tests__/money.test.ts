import { describe, expect, it } from 'vitest';
import { formatSEK, slugify, toMinor } from '@sharvi/shared';

describe('money helpers', () => {
  it('formats whole kronor without decimals and in SEK (never $)', () => {
    const out = formatSEK(34900, 'en');
    expect(out).toContain('349');
    expect(out).toContain('kr');
    expect(out).not.toContain('$');
  });

  it('converts major kronor to minor öre', () => {
    expect(toMinor(349)).toBe(34900);
    expect(toMinor(19.9)).toBe(1990);
  });
});

describe('slugify', () => {
  it('produces URL-safe slugs and expands ampersands', () => {
    expect(slugify('Bracelet & Bangles')).toBe('bracelet-and-bangles');
    expect(slugify('Antique Necklace Set')).toBe('antique-necklace-set');
  });
});
