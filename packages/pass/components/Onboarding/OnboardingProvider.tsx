import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import type { OnboardingStatus } from '@proton/pass/store/selectors';
import { selectOnboardingComplete, selectOnboardingEnabled, selectOnboardingState } from '@proton/pass/store/selectors';
import { OnboardingMessage } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import noop from '@proton/utils/noop';

type OnboardingContextValue = {
    acknowledge: () => void;
    complete: boolean;
    enabled: boolean;
    state: OnboardingStatus;
    steps: { done: number; total: number };
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
});

export const OnboardingProvider: FC<PropsWithChildren> = ({ children }) => {
    const { onboardingAcknowledge, onboardingCheck } = usePassCore();
    const extension = usePassExtensionLink();

    const state = useSelector(selectOnboardingState);
    const complete = useSelector(selectOnboardingComplete(extension.installed));
    const disabled = !useSelector(selectOnboardingEnabled(extension.installed));

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
        };
    }, [complete, enabled, extension, state]);

    return <OnboardingContext.Provider value={context}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => useContext(OnboardingContext);
