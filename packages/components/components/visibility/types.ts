/** How much of the element must be visible to trigger callbacks. */
export type VisibilityThreshold = 'any' | 'half' | 'full';

export interface VisibilityTrackerOptions {
    /**
     * Callback fired when the element enters the viewport.
     * Receives the total number of times the element has entered so far.
     *
     * When `once = true` (default) this fires **at most once** per mount,
     * so `count` will always be `1`.
     */
    onEnter?: (count: number) => void;

    /**
     * Callback fired when the element exits the viewport.
     * Receives the total number of times the element has exited so far.
     *
     * When `once = true` (default) this fires **at most once** per mount,
     * so `count` will always be `1`.
     */
    onExit?: (count: number) => void;

    /**
     * How much of the element must be visible to trigger the callbacks.
     *
     * - `"any"`  → any pixel visible (`0`)
     * - `"half"` → 50 % visible (`0.5`) — **default**
     * - `"full"` → fully visible (`1`)
     */
    threshold?: VisibilityThreshold;

    /**
     * Expands or shrinks the area used to decide when the element is "visible",
     * without changing the element or the viewport itself — same syntax as CSS `margin`.
     * Positive values trigger *before* the element reaches the viewport edge;
     * negative values require the element to pass further inside.
     *
     * @example "200px 0px"  // trigger 200 px before the element scrolls into view
     */
    marginAroundTarget?: string;

    /**
     * When `true` (default), each callback fires **at most once** per mount.
     * Set to `false` to re-fire callbacks every time the element enters or exits.
     */
    once?: boolean;
}
