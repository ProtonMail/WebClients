import { type ReactNode, createContext, useMemo } from 'react';

import { c } from 'ttag';

import onboardingExtension from '@proton/pass/assets/desktop-onboarding/onboarding-extension.svg';
import { OnboardingLockSetup } from '@proton/pass/components/Onboarding/OnboardingLockSetup';
import { OnboardingThemeSelect } from '@proton/pass/components/Onboarding/OnboardingThemeSelect';
import { useOnboardingUpgrade } from '@proton/pass/components/Onboarding/OnboardingUpgrade';
import { PASS_DOWNLOAD_URL } from '@proton/pass/constants';
import { PLANS } from '@proton/payments/core/constants';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export enum OnboardingType {
    WELCOME = 'WELCOME',
    WEB_ONBOARDING = 'WEB_ONBOARDING',
    B2B = 'B2B',
}

export type OnboardingStep = {
    action?: () => void;
    customAction?: ReactNode;
    actionClassName?: string;
    actionText?: string;
    component: ReactNode;
    description: ReactNode;
    group?: string;
    key: string;
    shortTitle: string;
    title: string;
    withHeader?: boolean;
};

export type OnboardingContextValue = {
    acknowledge: () => void;
    launch: () => void;
    markCompleted: (step: string) => void;
    completed: string[];
    enabled: boolean;
    isActive: boolean;
    steps: OnboardingStep[];
    type: OnboardingType;
};

export const OnboardingContext = createContext<OnboardingContextValue>({
    acknowledge: noop,
    launch: noop,
    markCompleted: noop,
    completed: [],
    enabled: false,
    isActive: false,
    steps: [],
    type: OnboardingType.WELCOME,
});

export const useOnboardingSteps = (stepKeys: (string | boolean)[]) => {
    const OnboardingUpgrade = useOnboardingUpgrade();

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
                            {DESKTOP_BUILD && (
                                <div className="mt-4">
                                    {c('Label')
                                        .t`You can choose between PIN code, biometrics, or your account password to unlock.`}
                                </div>
                            )}
                        </>
                    ),
                    group: c('Label').t`Security`,
                    key: 'unlock',
                    title: c('Label').t`How to unlock ${PASS_SHORT_APP_NAME}`,
                },
                {
                    shortTitle: c('Label').t`Unlock premium features`,
                    component: <OnboardingUpgrade.Content />,
                    description: <OnboardingUpgrade.Description />,
                    action: OnboardingUpgrade.navigateToUpgrade,
                    actionClassName: 'button-invert',
                    actionText:
                        OnboardingUpgrade.selected === PLANS.PASS
                            ? c('Label').t`Get ${PASS_SHORT_APP_NAME} Plus`
                            : c('Label').t`Get ${PASS_SHORT_APP_NAME} Unlimited`,
                    key: 'upgrade',
                    title: c('Label').t`Unlock premium features`,
                    withHeader: true,
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
            ].filter(({ key }) => stepKeys.includes(key)),
        [OnboardingUpgrade, stepKeys]
    );

    return { steps };
};
