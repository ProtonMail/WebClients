import { useMemo, useEffect, DependencyList } from 'react';
import { useUser } from 'react-components';

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
    const [user] = useUser();
    const key = `proton:welcome:${user.ID}`;

    useEffect(() => {
        if (!hasSessionStorage()) {
            return;
        }

        window.sessionStorage.setItem(key, 'true');
    }, []);

    return useMemo(() => {
        if (!hasSessionStorage()) {
            return false;
        }

        return !window.sessionStorage.getItem(key);
    }, deps);
};
