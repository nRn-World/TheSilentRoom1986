// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import WalkingScene from './WalkingScene';

describe('WalkingScene', () => {
  afterEach(() => cleanup());

  it('draws the four friends with soft collars instead of outlined necks', () => {
    const { container } = render(<WalkingScene />);
    const svg = container.querySelector('svg')!;
    expect(svg).toBeTruthy();
    expect(svg.querySelectorAll('.scene-person').length).toBe(4);
    expect(svg.querySelector('.scene-dog')).toBeTruthy();

    // The old twin stroke necks must never come back.
    const markup = svg.innerHTML;
    expect(markup).not.toContain('M240 248v24');
    expect(markup).not.toContain('M371 251v20');
    expect(markup).not.toContain('M172 250v23');
    expect(markup).not.toContain('#b77562');

    // Every friend keeps a head, a face and a full set of limbs.
    for (const person of svg.querySelectorAll('.scene-person')) {
      expect(person.querySelectorAll('path').length).toBeGreaterThanOrEqual(6);
    }
    expect(svg.querySelectorAll('.scene-person ellipse').length).toBeGreaterThanOrEqual(6);

    // The first friend stays in his original green coat and bucket hat.
    const third = svg.querySelector('.scene-person-three')!.innerHTML;
    expect(third).toContain('#9eb899');
    expect(third).toContain('#a49ab0');
  });
});
