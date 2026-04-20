import type { ReactNode } from 'react';

import './animated.scss';

/**
 * Animated container that expands and collapses its children.
 *
 * This component:
 * - Animates vertical expansion using CSS (`grid-template-rows` or similar in SCSS)
 * - Hides content when collapsed using `aria-hidden`
 * - Uses `inert` to prevent interaction when closed
 * - Provides layout-safe overflow handling for nested content
 *
 * @remarks
 * This is a low-level layout primitive used by compound components
 * such as {@link BranchContent}.
 *
 * It is intentionally presentation-only and does not manage state.
 *
 * @example
 * ```tsx
 * <AnimatedChildren isOpen={isOpen}>
 *   <div>Content</div>
 * </AnimatedChildren>
 * ```
 */
function AnimatedChildren({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
    return (
        <div
            {...(isOpen ? {} : { inert: '' })}
            data-component="animated-children"
            data-state={isOpen ? 'open' : 'closed'}
            aria-hidden={!isOpen}
        >
            <div className="flex flex-nowrap overflow-hidden flex-column gap-0.5">{children}</div>
        </div>
    );
}
AnimatedChildren.displayName = 'AnimatedChildren';

export { AnimatedChildren };
