import { createContext, useContext } from 'react';

/**
 * Shape of the {@link BranchContext} value.
 *
 * This context provides state and behavior for a single branch
 * within the sidebar tree structure.
 */
interface BranchContextValue {
    /**
     * Whether the branch is currently expanded.
     */
    isOpen: boolean;

    /**
     * Toggles the open/closed state of the branch.
     */
    toggle: () => void;

    /**
     * Nesting depth of the branch within the tree.
     * Used for visual indentation and hierarchy styling.
     */
    depth: number;
}

/**
 * Internal React context used to propagate {@link Branch} state
 * to compound subcomponents such as:
 *
 * - {@link BranchHeader}
 * - {@link BranchTrigger}
 * - {@link BranchContent}
 * - {@link Leaf}
 *
 * @remarks
 * This context is not intended for direct external consumption.
 * Use {@link useBranchContext} instead.
 */
const BranchContext = createContext<BranchContextValue | null>(null);

/**
 * Consumes {@link BranchContext} safely within branch subcomponents.
 *
 * This hook:
 * - Reads branch state from context
 * - Throws a descriptive error if used outside a `Branch`
 *
 * @param consumerName - Name of the component using the hook,
 * used to improve error messages.
 *
 * @throws Error if used outside a {@link Branch} provider
 *
 * @example
 * ```ts
 * const { isOpen, toggle } = useBranchContext('Branch.Header');
 * ```
 */
function useBranchContext(consumerName: string): BranchContextValue {
    const ctx = useContext(BranchContext);
    if (!ctx) {
        throw new Error(`<${consumerName}> must be used inside <Branch>`);
    }
    return ctx;
}

const STARTING_DEPTH = 1;

/**
 * Safely retrieves the current branch depth.
 *
 * This hook:
 * - Returns the nesting depth if inside a {@link Branch}
 * - Falls back to {@link STARTING_DEPTH} when used outside context
 *
 * @remarks
 * This is used to maintain visual hierarchy alignment for:
 * - indentation
 * - styling
 * - nested sidebar structure
 *
 * @returns Current branch depth or {@link STARTING_DEPTH}
 *
 * @example
 * ```ts
 * const depth = useTryBranchDepth();
 * ```
 */
function useTryBranchDepth(): BranchContextValue['depth'] {
    const ctx = useContext(BranchContext);
    return ctx ? ctx.depth : STARTING_DEPTH;
}

export { BranchContext, useBranchContext, useTryBranchDepth };
