import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { selectOnboardingComplete, selectOnboardingEnabled, selectOnboardingState } from '@proton/pass/store/selectors';
import { SpotlightMessage } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import noop from '@proton/utils/noop';

import { OnboardingContext, type OnboardingContextValue, OnboardingType } from './OnboardingContext';

export const B2BProvider: FC<PropsWithChildren> = ({ children }) => {
    const { spotlight } = usePassCore();
    const extension = usePassExtensionLink();
    const { navigate } = useNavigation();

    const state = useSelector(selectOnboardingState);
    const complete = useSelector(selectOnboardingComplete(extension.installed));
    const disabled = !useSelector(selectOnboardingEnabled(extension.installed));
    const isActive = useRouteMatch(getLocalPath('onboarding'));

    const [enabled, setEnabled] = useState(!disabled);

    useEffect(() => {
        if (enabled) {
            (async () => (await spotlight.check(SpotlightMessage.B2B_ONBOARDING)) ?? false)()
                .then(setEnabled)
                .catch(noop);
        }
    }, []);

    const context = useMemo<OnboardingContextValue>(() => {
        const steps = Object.values(state).concat(extension.supportedBrowser ? [extension.installed] : []);

        return {
            acknowledge: () => {
                setEnabled(false);
                void spotlight.acknowledge(SpotlightMessage.B2B_ONBOARDING);
            },
            launch: () => navigate(getLocalPath('onboarding')),
            complete,
            enabled,
            isActive: Boolean(isActive),
            state,
            steps: { done: steps.filter(truthy).length, total: steps.length },
            type: OnboardingType.B2B,
        };
    }, [complete, enabled, extension, state, isActive, navigate]);

    return <OnboardingContext.Provider value={context}>{children}</OnboardingContext.Provider>;
};
