import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';

interface OnboardingContextProps {
    isOnboardingCompleted: boolean | undefined;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
}

export const OnboardingContext = createContext<OnboardingContextProps | null>(null);

interface Props {
    children?: ReactNode;
}

const ONBOARDING_COOKIE_NAME = 'LumoOnboardingCompleted';

const storedOnboardingStatus = getCookie(ONBOARDING_COOKIE_NAME);

const getOnboardingStatusBoolean = (status: string | undefined) => {
    if (!status) {
        return false;
    }
    return status === 'true';
};

export const OnboardingProvider = ({ children }: Props) => {
    const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(() =>
        getOnboardingStatusBoolean(storedOnboardingStatus)
    );

    useEffect(() => {
        const syncToCookie = () => {
            const cookieValue = String(isOnboardingCompleted);
            setCookie({
                cookieName: ONBOARDING_COOKIE_NAME,
                cookieValue,
                path: '/',
                expirationDate: 'max',
            });
        };

        syncToCookie();
    }, [isOnboardingCompleted]);

    const completeOnboarding = () => {
        if (isOnboardingCompleted === true) {
            return;
        }
        setIsOnboardingCompleted(true);
    };

    // just for development purposes
    const resetOnboarding = () => {
        setIsOnboardingCompleted(false);
    };

    return (
        <OnboardingContext.Provider value={{ isOnboardingCompleted, completeOnboarding, resetOnboarding }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboardingContext = () => {
    const state = useContext(OnboardingContext);

    if (!state) {
        throw new Error('Onboarding Context needs to be initialized');
    }

    return state;
};
