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
        // Set from ProtonApp
        const flow = cache.get(WELCOME_FLAG_KEY);
        const hasDisplayNameStep = true; // flow === 'signup' || flow === 'welcome-full';
        const hasWelcomeModal = flow === 'welcome';
        // Assumes that user settings has been pre-loaded. Not using hook to avoid re-renders.
        const isWelcomeFlag = cache.get(UserSettingsModel.key)?.value?.WelcomeFlag === 0 || hasWelcomeModal;
        return {
            hasDisplayNameStep,
            isWelcomeFlag,
            isWelcomeFlow: hasDisplayNameStep || isWelcomeFlag,
        };
    });
    const setDone = useCallback(() => {
        cache.delete(WELCOME_FLAG_KEY);
        setState({});
    }, []);
    return [state, setDone];
};

export default useWelcomeFlags;
