import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { OnboardingModal } from '@proton/pass/components/Onboarding/OnboardingModal';
import { SpotlightMessage } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { OnboardingContext, type OnboardingContextValue, OnboardingType } from './OnboardingContext';

export const WelcomeProvider: FC<PropsWithChildren> = ({ children }) => {
    const { onboardingAcknowledge, onboardingCheck } = usePassCore();
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        (async () => (await onboardingCheck?.(SpotlightMessage.WELCOME)) ?? false)().then(setEnabled).catch(noop);
    }, []);

    const context = useMemo<OnboardingContextValue>(
        () => ({
            acknowledge: () => {
                setEnabled(false);
                void onboardingAcknowledge?.(SpotlightMessage.WELCOME);
            },
            launch: () => setEnabled(true),
            complete: false,
            enabled,
            isActive: enabled,
            state: { vaultCreated: false, vaultImported: false, vaultShared: false },
            steps: { total: 0, done: 0 },
            type: OnboardingType.WELCOME,
        }),
        [enabled]
    );

    return (
        <OnboardingContext.Provider value={context}>
            {children}
            <OnboardingModal open={enabled} onClose={() => setEnabled(false)} />
        </OnboardingContext.Provider>
    );
};
