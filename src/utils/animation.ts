/**
 * Maximum number of items that receive a staggered entrance delay.
 *
 * Beyond this, every item animates with the same delay as item 8.
 */
const MAX_STAGGER_STEPS = 8;

/** Milliseconds added per step of the stagger. */
export const STAGGER_STEP_MS = 60;

/**
 * Entrance delay for the item at `index` in a list.
 *
 * A raw `index * step` looks right for the first screenful and wrong for
 * everything after it: in a virtualized list `index` keeps growing, so row 40
 * would sit blank for 2.4s after scrolling into view, and the delay replays
 * every time a row is recycled. Capping the stagger keeps the effect on the
 * first screenful - where it is actually visible - and makes every later row
 * appear promptly.
 */
export function staggerDelay(index: number, stepMs: number = STAGGER_STEP_MS): number {
  return Math.min(index, MAX_STAGGER_STEPS) * stepMs;
}
