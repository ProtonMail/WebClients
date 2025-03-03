import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import {
    selectB2BOnboardingComplete,
    selectB2BOnboardingEnabled,
    selectB2BOnboardingState,
} from '@proton/pass/store/selectors';
import { SpotlightMessage } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { OnboardingContext, type OnboardingContextValue, OnboardingType } from './OnboardingContext';

export const B2BProvider: FC<PropsWithChildren> = ({ children }) => {
    const { spotlight } = usePassCore();
    const extension = usePassExtensionLink();
    const navigate = useNavigate();

    const state = useSelector(selectB2BOnboardingState);
    const complete = useMemoSelector(selectB2BOnboardingComplete, [extension.installed]);
    const disabled = !useMemoSelector(selectB2BOnboardingEnabled, [extension.installed]);
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
        return {
            acknowledge: () => {
                setEnabled(false);
                void spotlight.acknowledge(SpotlightMessage.B2B_ONBOARDING);
            },
            launch: () => navigate(getLocalPath('onboarding')),
            markCompleted: noop,
            complete,
            enabled,
            isActive: Boolean(isActive),
            steps: [],
            completed: [],
            type: OnboardingType.B2B,
        };
    }, [complete, enabled, extension, state, isActive, navigate]);

    return <OnboardingContext.Provider value={context}>{children}</OnboardingContext.Provider>;
};
