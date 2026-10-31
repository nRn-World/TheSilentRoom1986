/** A walking activity is a stretch of verified GPS movement. Short stationary GPS
 * jitter does not count as a completed activity until 100m is accumulated. */
export type Walk = { date: string; startedAt: number; lastAt: number; distance: number };
const SESSION_GAP_MS = 15 * 60 * 1000;
const MIN_ACTIVITY_METERS = 100;

export function recordWalk(walks: Walk[], date: string, now: number, distance: number): void {
  const last = walks.at(-1);
  if (last && last.date === date && now - last.lastAt <= SESSION_GAP_MS) {
    last.distance += distance;
    last.lastAt = now;
  } else {
    walks.push({ date, startedAt: now, lastAt: now, distance });
  }
}

export function countActivities(walks: Walk[]): Record<string, number> {
  return walks.reduce<Record<string, number>>((counts, walk) => {
    if (walk.distance >= MIN_ACTIVITY_METERS) counts[walk.date] = (counts[walk.date] || 0) + 1;
    return counts;
  }, {});
}
