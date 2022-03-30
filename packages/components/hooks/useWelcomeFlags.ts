import { useCallback, useState } from 'react';
import { UserSettings } from '@proton/shared/lib/interfaces';
import useCache from './useCache';

export const WELCOME_FLAGS_CACHE_KEY = 'welcome-flags';

export interface WelcomeFlagsState {
    hasGenericWelcomeStep?: boolean;
    isWelcomeFlow?: boolean;
    isDone?: boolean;
}

export const getWelcomeFlagsValue = (userSettings: UserSettings): WelcomeFlagsState => {
    const hasProductWelcomeStep = userSettings.WelcomeFlag === 0;
    const hasGenericWelcomeStep = userSettings.Flags.Welcomed === 0;
    return {
        hasGenericWelcomeStep,
        isWelcomeFlow: hasGenericWelcomeStep || hasProductWelcomeStep,
        isDone: false,
    };
};

const useWelcomeFlags = (): [WelcomeFlagsState, () => void] => {
    const cache = useCache();
    const [state, setState] = useState<WelcomeFlagsState>(() => {
        return cache.get(WELCOME_FLAGS_CACHE_KEY) || {};
    });
    const setDone = useCallback(() => {
        const newValue: WelcomeFlagsState = { isDone: true };
        cache.set(WELCOME_FLAGS_CACHE_KEY, newValue);
        setState(newValue);
    }, []);
    return [state, setDone];
};

export default useWelcomeFlags;
