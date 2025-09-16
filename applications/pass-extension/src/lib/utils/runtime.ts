import browser from '@proton/pass/lib/globals/browser';
import { not } from '@proton/pass/utils/fp/predicates';

export const isRuntimeActive = (() => {
    let active = true;
    return (): boolean => {
        if (!active) return false;
        try {
            return Boolean(browser?.runtime?.id);
        } catch {
            return (active = false);
        }
    };
})();

export const isRuntimeStale = not(isRuntimeActive);
