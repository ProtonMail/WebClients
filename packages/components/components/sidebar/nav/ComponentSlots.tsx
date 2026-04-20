import type { ReactNode } from 'react';

import type { IconSize } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

interface PlaceholderSlotProps {
    className?: string;
    size?: IconSize;
}

/**
 * Invisible layout placeholder used to reserve space in a flex row.
 *
 * This component:
 * - Maintains layout alignment inside flex containers
 * - Is visually hidden but still affects layout
 * - Is marked `aria-hidden` to avoid being read by screen readers
 *
 * @remarks
 * Typically used in compound components (e.g. icons, triggers)
 * where consistent spacing is required even when content is absent.
 *
 * @example
 * ```tsx
 * <Placeholder />
 * ```
 */
export function Placeholder({ className, size = 4 }: PlaceholderSlotProps) {
    return <span aria-hidden className={clsx(`icon-size-${size} shrink-0`, className)} />;
}

interface TextSlotProps {
    children: ReactNode;
    className?: string;
}
/**
 * Flexible text slot used inside compound components.
 *
 * This component:
 * - Expands to fill available space in a flex row
 * - Prevents overflow via `min-width: 0`
 * - Truncates overflowing text with ellipsis styling
 *
 * @remarks
 * Designed for use inside layout rows where icons,
 * triggers, and text need consistent alignment.
 *
 * @example
 * ```tsx
 * <Text>Settings</Text>
 * ```
 *
 * @example With custom styling
 * ```tsx
 * <Text className="text-lg">Account</Text>
 * ```
 */
export function Text({ children, className }: TextSlotProps) {
    return <span className={clsx('text-ellipsis flex-1 min-w-0 whitespace-nowrap', className)}>{children}</span>;
}
