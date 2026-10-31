/** One place defines how an estimated step count becomes a distance. */
export const METERS_PER_STEP = 0.75;
export const estimatedMeters = (steps: number) => Math.round(steps * METERS_PER_STEP);
