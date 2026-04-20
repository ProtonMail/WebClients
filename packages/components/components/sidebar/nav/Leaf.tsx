import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import clsx from '@proton/utils/clsx';

import { useTryBranchDepth } from './Branch.Context';
import * as Slots from './ComponentSlots';

interface LeafProps {
    /**
     * Destination path for navigation.
     *
     * Rendered using React Router's {@link NavLink}.
     */
    to: string;

    /** Optional click handler fired on navigation click. */
    onClick?: () => void;

    /** Content inside the leaf (typically icon + label). */
    children: ReactNode;

    /** Optional className for additional styling. */
    className?: string;
}

/**
 * A navigational leaf item used inside a {@link Branch} tree.
 *
 * This component:
 * - Renders a {@link NavLink} for routing
 * - Automatically applies active styling via React Router
 * - Inherits nesting depth from {@link useTryBranchDepth}
 * - Supports compound slots like `Leaf.IconPlaceholder` and `Leaf.Text`
 *
 * @remarks
 * This is typically the terminal node in a sidebar/tree structure.
 * It is designed to visually align with {@link Branch} items.
 *
 * @example
 * ```tsx
 * <Leaf to="/settings">
 *   <Leaf.IconPlaceholder />
 *   <Leaf.Text>Settings</Leaf.Text>
 * </Leaf>
 * ```
 *
 * @example With click handler
 * ```tsx
 * <Leaf to="/profile" onClick={() => console.log('clicked')}>
 *   Profile
 * </Leaf>
 * ```
 */
function Leaf({ to, onClick, children, className }: LeafProps) {
    const depth = useTryBranchDepth();

    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={(isActive) => clsx('flex gap-2 items-center rounded py-2 px-3', className, isActive && 'active')}
            data-sidebar-depth={depth}
            data-sidebar-leaf=""
        >
            {children}
        </NavLink>
    );
}
Leaf.displayName = 'Leaf';

Leaf.IconPlaceholder = Slots.Placeholder;
Leaf.Text = Slots.Text;

export { Leaf };
export type { LeafProps };
