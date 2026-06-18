import type { CSSProperties, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './TransitionSlot.scss';

export interface TransitionSlotProps {
    /** Key of the item to show. Must match one of the keys in `items`. */
    activeKey: string;
    /**
     * Map of key → node. Every item is mounted and stacked in the same slot, so the box sizes to
     * the largest one and the active item transitions over the others.
     * This component only owns the transition.
     */
    items: Partial<Record<string, ReactNode>>;
    /** Transition duration (any CSS time, e.g. `0.25s`). Defaults to the value in the stylesheet. */
    duration?: string;
    /**
     * The scale items growth/shrink ratio
     *  - `0.6` (default): gentle pop-in from 60%
     *  - `1`: no zoom — a pure crossfade
     *  - `> 1` (e.g. `1.1`): content shrinks into place instead of growing
     */
    scaleTransitionRatio?: number;
    className?: string;
    style?: CSSProperties;
}

/**
 * A single slot that shows one of several stacked nodes and fades + scales between them as
 * `activeKey` changes. Keep the consumer's nodes referentially stable across a change (don't swap
 * them out) so the transition plays. Commonly used to move a loader into a success/error icon, but
 * the items are arbitrary.
 *
 * Note: the transition is a fade + scale, not a path-level morph — it can't tween one SVG shape
 * into another. It only *reads* as a morph when the items line up visually, e.g. icons that share
 * the same viewBox and centre (like CircleLoader → IcCheckmarkCircleFilled). For unrelated shapes
 * it's an honest crossfade.
 */
export const TransitionSlot = ({
    activeKey,
    items,
    duration,
    scaleTransitionRatio,
    className,
    style,
}: TransitionSlotProps) => (
    <span
        className={clsx('transition-slot', className)}
        style={
            {
                '--transition-slot-duration': duration,
                '--transition-slot-scale-transition-ratio': scaleTransitionRatio,
                ...style,
            } as CSSProperties
        }
    >
        {Object.entries(items).map(([key, node]) => {
            const isActive = key === activeKey;
            return (
                <span
                    key={key}
                    className={clsx('transition-slot-item', isActive && 'transition-slot-item--active')}
                    aria-hidden={!isActive}
                >
                    {node}
                </span>
            );
        })}
    </span>
);
