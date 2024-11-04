import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { OnboardingModal } from '@proton/pass/components/Onboarding/OnboardingModal';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import type { OnboardingStatus } from '@proton/pass/store/selectors';
import {
    selectOnboardingComplete,
    selectOnboardingEnabled,
    selectOnboardingState,
    selectPassPlan,
} from '@proton/pass/store/selectors';
import { OnboardingMessage } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import noop from '@proton/utils/noop';

type OnboardingContextValue = {
    acknowledge: () => void;
    complete: boolean;
    enabled: boolean;
    state: OnboardingStatus;
    steps: { done: number; total: number };
    launch: () => void;
    isActive: boolean;
};

const OnboardingContext = createContext<OnboardingContextValue>({
    acknowledge: noop,
    complete: false,
    enabled: false,
    state: {
        vaultCreated: false,
        vaultImported: false,
        vaultShared: false,
    },
    steps: { done: 0, total: 0 },
    launch: noop,
    isActive: false,
});

const WelcomeProvider: FC<PropsWithChildren> = ({ children }) => {
    const [enabled, setEnabled] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const { onboardingAcknowledge, onboardingCheck } = usePassCore();
    const acknowledge = () => {
        setEnabled(false);
        void onboardingAcknowledge?.(OnboardingMessage.WELCOME);
    };

    useEffect(() => {
        (async () => (await onboardingCheck?.(OnboardingMessage.WELCOME)) ?? false)()
            .then((res) => setEnabled(res))
            .catch(noop);
    }, []);

    const context: OnboardingContextValue = {
        acknowledge,
        complete: false,
        enabled,
        isActive,
        launch: () => setIsActive(true),
        steps: { total: 0, done: 0 },
        state: { vaultCreated: false, vaultImported: false, vaultShared: false },
    };

    return (
        <OnboardingContext.Provider value={context}>
            {children}
            <OnboardingModal open={enabled && isActive} onClose={() => setIsActive(false)} />
        </OnboardingContext.Provider>
    );
};

const B2BProvider: FC<PropsWithChildren> = ({ children }) => {
    const { onboardingAcknowledge, onboardingCheck } = usePassCore();
    const extension = usePassExtensionLink();
    const { navigate } = useNavigation();

    const state = useSelector(selectOnboardingState);
    const complete = useSelector(selectOnboardingComplete(extension.installed));
    const disabled = !useSelector(selectOnboardingEnabled(extension.installed));
    const isActive = useRouteMatch(getLocalPath('onboarding'));

    const [enabled, setEnabled] = useState(!disabled);

    useEffect(() => {
        if (disabled) return;

        (async () => (await onboardingCheck?.(OnboardingMessage.B2B_ONBOARDING)) ?? false)()
            .then((res) => setEnabled(res))
            .catch(noop);
    }, []);

    const context = useMemo<OnboardingContextValue>(() => {
        const steps = Object.values(state).concat(extension.supportedBrowser ? [extension.installed] : []);

        return {
            acknowledge: () => {
                setEnabled(false);
                void onboardingAcknowledge?.(OnboardingMessage.B2B_ONBOARDING);
            },
            enabled,
            complete,
            state,
            steps: {
                done: steps.filter(truthy).length,
                total: steps.length,
            },
            launch: () => navigate(getLocalPath('onboarding')),
            isActive: Boolean(isActive),
        };
    }, [complete, enabled, extension, state]);

    return <OnboardingContext.Provider value={context}>{children}</OnboardingContext.Provider>;
};

export const OnboardingProvider: FC<PropsWithChildren> = ({ children }) => {
    const passPlan = useSelector(selectPassPlan);
    const onboardingMessage =
        !isBusinessPlan(passPlan) && DESKTOP_BUILD ? OnboardingMessage.WELCOME : OnboardingMessage.B2B_ONBOARDING;

    const RenderedProvider = useMemo(() => {
        switch (onboardingMessage) {
            case OnboardingMessage.B2B_ONBOARDING:
                return B2BProvider;
            case OnboardingMessage.WELCOME:
                return WelcomeProvider;
            default:
                return () => children;
        }
    }, [onboardingMessage]);

    return <RenderedProvider>{children}</RenderedProvider>;
};

export const useOnboarding = () => useContext(OnboardingContext);
