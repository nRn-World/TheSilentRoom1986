import { describe, expect, it } from 'vitest';
import { countActivities, recordWalk, type Walk } from './activity';

describe('GPS walking activities', () => {
  it('groups nearby movements into one activity and ignores tiny movements', () => {
    const walks: Walk[] = [];
    recordWalk(walks, '2026-10-30', 0, 45);
    expect(countActivities(walks)).toEqual({});
    recordWalk(walks, '2026-10-30', 60_000, 60);
    expect(countActivities(walks)).toEqual({ '2026-10-30': 1 });
  });
  it('starts a new activity after fifteen minutes and on a new day', () => {
    const walks: Walk[] = [];
    recordWalk(walks, '2026-10-30', 0, 110);
    recordWalk(walks, '2026-10-30', 16 * 60_000, 140);
    recordWalk(walks, '2026-10-31', 17 * 60_000, 120);
    expect(countActivities(walks)).toEqual({ '2026-10-30': 2, '2026-10-31': 1 });
  });
});
