import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import Icon from '../../icon/Icon';
import { BranchContext, useBranchContext, useTryBranchDepth } from './Branch.Context';
import * as Slots from './ComponentSlots';
import { AnimatedChildren } from './animated';

interface BaseBranchProps {
    children: ReactNode;
    className?: string;
}

interface ControlledBranchProps extends BaseBranchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultOpen?: never;
}

interface UncontrolledBranchProps extends BaseBranchProps {
    defaultOpen?: boolean;
    open?: never;
    onOpenChange?: never;
}

/**
 * Props for the {@link Branch} component.
 *
 * Supports both **controlled** and **uncontrolled** usage:
 *
 * - **Controlled**: provide `open` and `onOpenChange`
 * - **Uncontrolled**: provide `defaultOpen`
 *
 * @example Controlled
 * ```tsx
 * <Branch open={isOpen} onOpenChange={setIsOpen}>
 *   ...
 * </Branch>
 * ```
 *
 * @example Uncontrolled
 * ```tsx
 * <Branch defaultOpen>
 *   ...
 * </Branch>
 * ```
 */
type BranchProps = ControlledBranchProps | UncontrolledBranchProps;

/**
 * A collapsible sidebar branch that can contain nested items.
 *
 * Provides context to subcomponents like `Branch.Header`, `Branch.Trigger`,
 * and `Branch.Content`.
 *
 * Supports both **controlled** and **uncontrolled** state:
 *
 * - Use `open` + `onOpenChange` for controlled behavior
 * - Use `defaultOpen` for uncontrolled behavior
 *
 * @remarks
 * The component manages its open state internally unless controlled.
 * It also tracks nesting depth via context for styling purposes.
 *
 * @example
 * ```tsx
 * <Branch defaultOpen>
 *   <Branch.Header>
 *     <Branch.Trigger />
 *     Section
 *   </Branch.Header>
 *   <Branch.Content>
 *     ...
 *   </Branch.Content>
 * </Branch>
 * ```
 */
function Branch({ open, onOpenChange, defaultOpen = false, children, className }: BranchProps) {
    const depth = useTryBranchDepth();

    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open! : internalOpen;

    const toggle = useCallback(() => {
        if (isControlled) {
            onOpenChange?.(!isOpen);
        } else {
            setInternalOpen((isOpen) => !isOpen);
        }
    }, [isControlled, isOpen, onOpenChange]);

    const contextValue = useMemo(() => ({ isOpen, toggle, depth: depth + 1 }), [isOpen, toggle, depth]);

    return (
        <BranchContext.Provider value={contextValue}>
            <div
                data-sidebar-depth={depth}
                data-state={isOpen ? 'open' : 'closed'}
                className={clsx('rounded flex flex-nowrap flex-column gap-0.5', className)}
            >
                {children}
            </div>
        </BranchContext.Provider>
    );
}
Branch.displayName = 'Branch';

interface BranchHeaderProps {
    children: ReactNode;
    className?: string;
}

/**
 * Clickable header for a {@link Branch}.
 *
 * This component:
 * - Toggles the open/closed state of the parent Branch
 * - Exposes accessibility state via `aria-expanded`
 * - Must be used inside a `Branch` context
 *
 * @remarks
 * This is typically the main interactive row of a branch,
 * containing labels and optional triggers/icons.
 *
 * @example
 * ```tsx
 * <Branch.Header>
 *   <Branch.Trigger />
 *   Settings
 * </Branch.Header>
 * ```
 */
function BranchHeader({ children, className }: BranchHeaderProps) {
    const { isOpen, toggle } = useBranchContext('Branch.Header');
    return (
        <button
            type="button"
            onClick={toggle}
            aria-expanded={isOpen}
            data-sidebar-header=""
            className={clsx('flex gap-2 py-2 px-3 rounded items-center', className)}
        >
            {children}
        </button>
    );
}
BranchHeader.displayName = 'Branch.Header';

interface BranchTriggerProps {
    /** Optional className for styling the icon. */
    className?: string;

    /**
     * Icon name to render.
     * @default 'chevron-down-filled'
     */
    name?: IconName;

    /**
     * Rotation configuration for icon open/closed states.
     */
    rotation?: {
        /** Icon rotation when branch is open. */
        open?: number;

        /** Icon rotation when branch is closed. */
        closed?: number;
    };
}

/**
 * Visual indicator for the open/closed state of a {@link Branch}.
 *
 * This component:
 * - Does NOT handle interaction
 * - Purely reflects state visually via icon rotation
 * - Must be used inside a `Branch` context
 *
 * @example
 * ```tsx
 * <Branch.Trigger />
 * ```
 *
 * @example Custom rotation
 * ```tsx
 * <Branch.Trigger rotation={{ open: 90, closed: 0 }} />
 * ```
 */
function BranchTrigger({
    className,
    name = 'chevron-down-filled',
    rotation = { open: 0, closed: 180 },
}: BranchTriggerProps) {
    const { isOpen } = useBranchContext('Branch.Trigger');

    return (
        <Icon
            data-sidebar-trigger=""
            name={name}
            className={className}
            rotate={isOpen ? rotation.open : rotation.closed}
        />
    );
}
BranchTrigger.displayName = 'Branch.Trigger';

interface BranchContentProps {
    children: ReactNode;
}

/**
 * Collapsible content container for a {@link Branch}.
 *
 * This component:
 * - Shows or hides content based on Branch state
 * - Handles animation via {@link AnimatedChildren}
 * - Must be used inside a `Branch` context
 *
 * @remarks
 * This is the animated container that expands/collapses
 * when the branch state changes.
 *
 * @example
 * ```tsx
 * <Branch.Content>
 *   <div>Nested items</div>
 * </Branch.Content>
 * ```
 */
function BranchContent({ children }: BranchContentProps) {
    const { isOpen } = useBranchContext('Branch.Content');
    return <AnimatedChildren isOpen={isOpen}>{children}</AnimatedChildren>;
}
BranchContent.displayName = 'Branch.Content';

Branch.Header = BranchHeader;
Branch.Trigger = BranchTrigger;
Branch.IconPlaceholder = Slots.Placeholder;
Branch.Text = Slots.Text;
Branch.Content = BranchContent;

export { Branch };
export type { BranchProps, BranchHeaderProps, BranchTriggerProps, BranchContentProps };
