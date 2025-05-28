import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import onboardingExtension from '@proton/pass/assets/desktop-onboarding/onboarding-extension.svg';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { OnboardingLockSetup } from '@proton/pass/components/Onboarding/OnboardingLockSetup';
import { OnboardingModal } from '@proton/pass/components/Onboarding/OnboardingModal';
import { OnboardingThemeSelect } from '@proton/pass/components/Onboarding/OnboardingThemeSelect';
import type { AvailablePlans } from '@proton/pass/components/Onboarding/OnboardingUpgrade';
import { PASS_DOWNLOAD_URL, UpsellRef } from '@proton/pass/constants';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { usePassExtensionInstalled } from '@proton/pass/hooks/usePassExtensionInstalled';
import { selectAllItems, selectPassPlan, selectUserPlan } from '@proton/pass/store/selectors';
import { SpotlightMessage } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { prop } from '@proton/pass/utils/fp/lens';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { PLANS } from '@proton/payments';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import * as OnboardingUpgrade from '../OnboardingUpgrade';
import {
    OnboardingContext,
    type OnboardingContextValue,
    type OnboardingStep,
    OnboardingType,
} from './OnboardingContext';

export const WelcomeProvider: FC<PropsWithChildren> = ({ children }) => {
    const { spotlight } = usePassCore();
    const hasExtension = usePassExtensionInstalled(!DESKTOP_BUILD);
    const [selected, setSelected] = useState<AvailablePlans>(PLANS.PASS);
    const [enabled, setEnabled] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [completed, setCompleted] = useState<string[]>([]);
    const hasItems = useSelector(selectAllItems).length > 0;
    const userPlan = useSelector(selectUserPlan);
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE && userPlan?.InternalName === 'free';
    const message = DESKTOP_BUILD ? SpotlightMessage.WELCOME : SpotlightMessage.WEB_ONBOARDING;
    const navigateToUpgrade = useNavigateToUpgrade({
        upsellRef: selected === PLANS.PASS ? UpsellRef.PLUS_PLAN_ONBOARDING : UpsellRef.UNLIMITED_PLAN_ONBOARDING,
    });

    const steps = useMemo<OnboardingStep[]>(
        () =>
            [
                {
                    key: 'look-and-feel',
                    shortTitle: c('Label').t`Select your theme`,
                    actionText: c('Label').t`Select theme`,
                    description: () => c('Label').t`Choose your preferred look and feel.`,
                    group: c('Label').t`Personalize`,
                    title: c('Label').t`Make it your own.`,
                    component: OnboardingThemeSelect,
                },
                hasItems && {
                    key: 'unlock',
                    shortTitle: c('Label').t`Choose unlock method`,
                    component: () => (
                        <div className="pass-onboarding-modal--lock">
                            <p className="text-bold mt-0">{c('Label').t`Unlock with:`}</p>
                            <OnboardingLockSetup />
                        </div>
                    ),
                    description: () => (
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
                    title: c('Label').t`How to unlock ${PASS_SHORT_APP_NAME}`,
                },
                isFreePlan && {
                    key: 'upgrade',
                    shortTitle: c('Label').t`Unlock premium features`,
                    component: OnboardingUpgrade.Content,
                    description: OnboardingUpgrade.Description,
                    action: navigateToUpgrade,
                    actionClassName: 'button-invert',
                    actionText:
                        selected === PLANS.PASS
                            ? c('Label').t`Get ${PASS_SHORT_APP_NAME} Plus`
                            : c('Label').t`Get ${PASS_SHORT_APP_NAME} Unlimited`,
                    title: c('Label').t`Unlock premium features`,
                    withHeader: true,
                },
                !hasExtension && {
                    key: 'extension',
                    shortTitle: c('Label').t`Install extension`,
                    action: () => window.open(PASS_DOWNLOAD_URL, '_blank'),
                    actionText: c('Label').t`Install and continue`,
                    component: () => <img src={onboardingExtension} className="w-full" alt="" />,
                    description: () => c('Label').t`Get the extension for your browser.`,
                    group: c('Label').t`Browse faster, smarter`,
                    title: c('Label').t`Your passwords. Everywhere.`,
                },
            ].filter(truthy),
        [hasItems, isFreePlan, hasExtension, selected]
    );

    useEffect(() => {
        (async () => (await spotlight.check(message)) ?? false)()
            .then((enabled) => {
                /* Auto-lauch on provider mount */
                setEnabled(enabled);
                setIsActive(enabled);
            })
            .catch(noop);
    }, []);

    const context = useMemo<OnboardingContextValue>(
        () => ({
            acknowledge: () => {
                setEnabled(false);
                void spotlight.acknowledge(message);
            },
            launch: () => {
                setEnabled(true);
                setIsActive(true);
            },
            markCompleted: (step: string) => setCompleted((steps) => Array.from(new Set(steps.concat(step)))),
            enabled,
            isActive,
            steps,
            completed,
            type: DESKTOP_BUILD ? OnboardingType.WELCOME : OnboardingType.WEB_ONBOARDING,
            selected,
            setSelected,
        }),
        [enabled, isActive, steps, completed, selected]
    );

    useEffect(() => {
        const stepKeys = steps.map(prop('key'));
        setCompleted((completed) => completed.filter((step) => stepKeys.includes(step)));
    }, [steps]);

    return (
        <OnboardingContext.Provider value={context}>
            {children}
            {enabled && isActive && <OnboardingModal open onClose={() => setIsActive(false)} />}
        </OnboardingContext.Provider>
    );
};
