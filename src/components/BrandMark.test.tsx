// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import BrandMark from './BrandMark';

describe('brand mark', () => {
  it('uses the supplied artwork from a local file, in every mode', () => {
    const { container } = render(<BrandMark size={40} />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/brand-mark.png');
    expect(img?.getAttribute('width')).toBe('40');
    // The logo must never be fetched from a third party.
    expect(img?.getAttribute('src')).not.toMatch(/^https?:/);
    expect(img?.getAttribute('alt')).toBe('');
    // Loaded eagerly so the mark never pops in late when the live view opens.
    expect(img?.getAttribute('loading')).toBe('eager');
  });
});
