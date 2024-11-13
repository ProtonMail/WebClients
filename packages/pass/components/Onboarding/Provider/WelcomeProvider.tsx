import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import onboardingExtension from '@proton/pass/assets/desktop-onboarding/onboarding-extension.svg';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { OnboardingLockSetup } from '@proton/pass/components/Onboarding/OnboardingLockSetup';
import { OnboardingModal } from '@proton/pass/components/Onboarding/OnboardingModal';
import { OnboardingThemeSelect } from '@proton/pass/components/Onboarding/OnboardingThemeSelect';
import { PASS_DOWNLOAD_URL } from '@proton/pass/constants';
import { SpotlightMessage } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { not } from '@proton/pass/utils/fp/predicates';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import {
    OnboardingContext,
    type OnboardingContextValue,
    type OnboardingStep,
    OnboardingType,
} from './OnboardingContext';

export const WelcomeProvider: FC<PropsWithChildren> = ({ children }) => {
    const { spotlight } = usePassCore();
    const [enabled, setEnabled] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [completed, setCompleted] = useState<string[]>([]);

    const steps = useMemo<OnboardingStep[]>(
        () =>
            [
                {
                    shortTitle: c('Label').t`Select your theme`,
                    actionText: c('Label').t`Select theme`,
                    description: c('Label').t`Choose your preferred look and feel.`,
                    group: c('Label').t`Personalize`,
                    key: 'look-and-feel',
                    title: c('Label').t`Make it your own.`,
                    component: <OnboardingThemeSelect />,
                },
                {
                    shortTitle: c('Label').t`Choose unlock method`,
                    component: (
                        <div className="pass-onboarding-modal--lock">
                            <p className="text-bold mt-0">{c('Label').t`Unlock with:`}</p>
                            <OnboardingLockSetup />
                        </div>
                    ),
                    description: (
                        <>
                            {c('Label')
                                .t`For security reasons, ${PASS_SHORT_APP_NAME} automatically locks itself after 10 minutes of inactivity.`}
                            <br />
                            <br />
                            {c('Label')
                                .t`You can choose between PIN code, biometrics, or your account password to unlock.`}
                        </>
                    ),
                    group: c('Label').t`Security`,
                    key: 'unlock',
                    title: c('Label').t`How to unlock ${PASS_SHORT_APP_NAME}`,
                },
                {
                    shortTitle: c('Label').t`Install extension`,
                    action: () => window.open(PASS_DOWNLOAD_URL, '_blank'),
                    actionText: c('Label').t`Install and continue`,
                    component: <img src={onboardingExtension} className="w-full" alt="" />,
                    description: c('Label').t`Get the extension for your browser.`,
                    group: c('Label').t`Browse faster, smarter`,
                    key: 'extension',
                    title: c('Label').t`Your passwords. Everywhere.`,
                },
            ].filter(not(prop('hidden'))),
        []
    );

    useEffect(() => {
        (async () => (await spotlight.check(SpotlightMessage.WELCOME)) ?? false)()
            .then((enabled) => {
                setEnabled(enabled);
                // Auto-lauch on provider mount
                setIsActive(enabled);
            })
            .catch(noop);
    }, []);

    const context = useMemo<OnboardingContextValue>(
        () => ({
            acknowledge: () => {
                setEnabled(false);
                void spotlight.acknowledge(SpotlightMessage.WELCOME);
            },
            launch: () => {
                setEnabled(true);
                setIsActive(true);
            },
            markCompleted: (step: string) => setCompleted([...completed, step]),
            enabled,
            isActive,
            steps,
            completed,
            type: OnboardingType.WELCOME,
        }),
        [enabled, isActive, steps, completed]
    );

    return (
        <OnboardingContext.Provider value={context}>
            {children}
            <OnboardingModal open={enabled && isActive} onClose={() => setIsActive(false)} />
        </OnboardingContext.Provider>
    );
};
