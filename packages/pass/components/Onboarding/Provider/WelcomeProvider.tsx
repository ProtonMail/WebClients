import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { OnboardingModal } from '@proton/pass/components/Onboarding/OnboardingModal';
import { usePassExtensionInstalled } from '@proton/pass/hooks/usePassExtensionInstalled';
import { selectAllItems, selectPassPlan } from '@proton/pass/store/selectors';
import type { SpotlightMessage } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import noop from '@proton/utils/noop';

import {
    OnboardingContext,
    type OnboardingContextValue,
    type OnboardingType,
    useOnboardingSteps,
} from './OnboardingContext';

type WelcomeProviderParams = {
    message: SpotlightMessage;
    type: OnboardingType;
};

const WelcomeProvider: FC<PropsWithChildren<WelcomeProviderParams>> = ({ message, type, children }) => {
    const { spotlight } = usePassCore();
    const hasExtension = usePassExtensionInstalled(!DESKTOP_BUILD);
    const [enabled, setEnabled] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [completed, setCompleted] = useState<string[]>([]);
    const hasItems = useSelector(selectAllItems).length > 0;
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const { steps } = useOnboardingSteps([
        'look-and-feel',
        hasItems && 'unlock',
        isFreePlan && 'upgrade',
        !hasExtension && 'extension',
    ]);

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
            type,
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

export const createWelcomeProvider = (params: WelcomeProviderParams) => (props: PropsWithChildren) => (
    <WelcomeProvider {...params} {...props} />
);
