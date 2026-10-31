/** step.by.step brand icon — the supplied artwork with the two footprint mascots.
 * A small, preloaded copy of the artwork is used so the mark is painted immediately in every view. */
export default function BrandMark({ size = 25 }: { size?: number }) {
  return <img className="brand-mark-image" src="/brand-mark.png" width={size} height={size} alt="" draggable={false} loading="eager" decoding="sync"/>;
}
