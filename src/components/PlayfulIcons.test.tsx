import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Footprints, Heart, Target, Trophy } from './PlayfulIcons';

describe('step.by.step illustrated icon family', () => {
  it('renders purpose-drawn SVGs instead of an icon font', () => {
    for (const Icon of [Footprints, Target, Trophy]) {
      const html = renderToStaticMarkup(<Icon size={32} />);
      expect(html).toContain('viewBox="0 0 48 48"');
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('<path');
    }
  });

  it('fills a liked heart while leaving the unliked heart outlined', () => {
    expect(renderToStaticMarkup(<Heart fill="currentColor" />)).toContain('fill="currentColor"');
    expect(renderToStaticMarkup(<Heart fill="none" />)).toContain('fill="none"');
  });
});
