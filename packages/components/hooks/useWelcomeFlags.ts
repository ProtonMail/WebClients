import { useCallback, useState } from 'react';
import { UserSettingsModel } from 'proton-shared/lib/models';
import useCache from './useCache';

export const WELCOME_FLAG_KEY = 'flow';

export interface WelcomeFlagsState {
    hasDisplayNameStep?: boolean;
    isWelcomeFlow?: boolean;
    isWelcomeFlag?: boolean;
}

const useWelcomeFlags = (): [WelcomeFlagsState, () => void] => {
    const cache = useCache();
    const [state, setState] = useState<WelcomeFlagsState>(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const welcomeParam = searchParams.get('welcome') || '';
        // Set from ProtonApp
        const flow = cache.get(WELCOME_FLAG_KEY);
        const hasDisplayNameStep = flow === 'signup' || welcomeParam === 'true';
        const hasSeenFlow = flow === 'seen';
        // Assumes that user settings has been pre-loaded. Not using hook to avoid re-renders.
        const isWelcomeFlag = !hasSeenFlow && cache.get(UserSettingsModel.key)?.value?.WelcomeFlag === 0;
        return {
            hasDisplayNameStep,
            isWelcomeFlag,
            isWelcomeFlow: hasDisplayNameStep || isWelcomeFlag,
        };
    });
    const setDone = useCallback(() => {
        cache.set(WELCOME_FLAG_KEY, 'seen');
        setState({});
    }, []);
    return [state, setDone];
};

export default useWelcomeFlags;
