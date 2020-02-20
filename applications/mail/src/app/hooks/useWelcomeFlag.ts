import { useMemo, useEffect, DependencyList } from 'react';

const SESSION_KEY = 'proton:welcome';

// TODO: Export this function in proton-shared and use it
const hasSessionStorage = () => {
    // Wrap in try-catch to avoid throwing SecurityError on safari when storage is disabled.
    try {
        return !!window.sessionStorage;
    } catch (e) {
        return false;
    }
};

/**
 * Returns true the first time (depending on deps) it's called in session, false every time after
 * Session detection is based on browser sessionStorage time to live
 */
export const useWelcomeFlag = (deps: DependencyList) => {
    useEffect(() => {
        if (!hasSessionStorage()) {
            return;
        }

        window.sessionStorage.setItem(SESSION_KEY, 'true');
    }, []);

    return useMemo(() => {
        if (!hasSessionStorage()) {
            return false;
        }

        return !window.sessionStorage.getItem(SESSION_KEY);
    }, deps);
};
