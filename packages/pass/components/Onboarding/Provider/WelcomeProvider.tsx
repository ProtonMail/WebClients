import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { OnboardingModal } from '@proton/pass/components/Onboarding/OnboardingModal';
import { OnboardingMessage } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { OnboardingContext, type OnboardingContextValue } from './OnboardingContext';

export const WelcomeProvider: FC<PropsWithChildren> = ({ children }) => {
    const { onboardingAcknowledge, onboardingCheck } = usePassCore();
    const [enabled, setEnabled] = useState(false);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        (async () => (await onboardingCheck?.(OnboardingMessage.WELCOME)) ?? false)()
            .then((res) => setEnabled(res))
            .catch(noop);
    }, []);

    const context = useMemo<OnboardingContextValue>(
        () => ({
            acknowledge: () => {
                setEnabled(false);
                void onboardingAcknowledge?.(OnboardingMessage.WELCOME);
            },
            launch: () => setIsActive(true),
            complete: false,
            enabled,
            isActive,
            state: { vaultCreated: false, vaultImported: false, vaultShared: false },
            steps: { total: 0, done: 0 },
        }),
        [isActive, enabled]
    );

    return (
        <OnboardingContext.Provider value={context}>
            {children}
            <OnboardingModal open={enabled && isActive} onClose={() => setIsActive(false)} />
        </OnboardingContext.Provider>
    );
};
