import type { ToolbarPinState } from '../../../types/browser';
import { logger } from '../../../utils/logger';
import browser from '../../globals/browser';

/** `action.getUserSettings` is MV3-only and unevenly deployed: Chrome has it
 * since 91, Firefox only landed it well after our 109 floor, and Safari does
 * not implement it. Feature-detect rather than branch on the build target so
 * a browser gaining support is picked up without a code change. Callers must
 * treat `unknown` as "no signal" — it is not a synonym for `unpinned`. */
export const getToolbarPinState = async (): Promise<ToolbarPinState> => {
    try {
        /** Safari has no pinnable extensions menu — the action icon is always on
         * the toolbar — so the question doesn't apply and `unknown` would be
         * misleading rather than merely uninformative. */
        if (BUILD_TARGET === 'safari') return 'pinned';

        if (typeof browser.action?.getUserSettings !== 'function') return 'unknown';

        const { isOnToolbar } = await browser.action.getUserSettings();
        if (typeof isOnToolbar !== 'boolean') return 'unknown';

        return isOnToolbar ? 'pinned' : 'unpinned';
    } catch (error) {
        logger.warn('[Extension::Pinned] could not resolve toolbar pin state', error);
        return 'unknown';
    }
};
