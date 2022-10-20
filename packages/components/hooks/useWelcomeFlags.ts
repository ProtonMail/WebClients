import { useCallback, useEffect, useState } from 'react';

import { UserSettings } from '@proton/shared/lib/interfaces';

import useCache from './useCache';

export const WELCOME_FLAGS_CACHE_KEY = 'welcome-flags';

export interface WelcomeFlagsState {
    hasGenericWelcomeStep: boolean;
    isWelcomeFlow: boolean;
    isDone: boolean;
}

export const getWelcomeFlagsValue = (userSettings: Pick<UserSettings, 'WelcomeFlag' | 'Flags'>): WelcomeFlagsState => {
    const hasProductWelcomeStep = userSettings.WelcomeFlag === 0;
    const hasGenericWelcomeStep = userSettings.Flags.Welcomed === 0;
    const isWelcomeFlow = hasGenericWelcomeStep || hasProductWelcomeStep;
    return {
        hasGenericWelcomeStep,
        isWelcomeFlow,
        isDone: !isWelcomeFlow,
    };
};

const defaultValue: WelcomeFlagsState = {
    hasGenericWelcomeStep: false,
    isWelcomeFlow: false,
    isDone: true,
};

const useWelcomeFlags = (): [WelcomeFlagsState, () => void] => {
    const cache = useCache();
    const [state, setState] = useState<WelcomeFlagsState>(() => {
        return cache.get(WELCOME_FLAGS_CACHE_KEY) || defaultValue;
    });

    useEffect(() => {
        const cacheListener = (key: string) => {
            if (key !== WELCOME_FLAGS_CACHE_KEY) {
                return;
            }
            setState(cache.get(key));
        };
        return cache.subscribe(cacheListener);
    }, []);

    const setDone = useCallback(() => {
        const newValue: WelcomeFlagsState = { ...state, isDone: true };
        cache.set(WELCOME_FLAGS_CACHE_KEY, newValue);
    }, []);

    return [state, setDone];
};

export default useWelcomeFlags;
