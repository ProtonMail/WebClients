import type { FC, PropsWithChildren } from 'react';
import { Fragment, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { B2BProvider } from '@proton/pass/components/Onboarding/Provider/B2BProvider';
import {
    OnboardingContext,
    type OnboardingContextValue,
} from '@proton/pass/components/Onboarding/Provider/OnboardingContext';
import { WelcomeProvider } from '@proton/pass/components/Onboarding/Provider/WelcomeProvider';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import { selectCanCreateItems, selectPassPlan } from '@proton/pass/store/selectors';

export const OnboardingProvider: FC<PropsWithChildren> = ({ children }) => {
    const plan = useSelector(selectPassPlan);
    const canCreateItems = useSelector(selectCanCreateItems);

    const Provider = useMemo(() => {
        if (isBusinessPlan(plan)) return canCreateItems ? B2BProvider : Fragment;
        if (EXTENSION_BUILD) return Fragment;
        return WelcomeProvider;
    }, [plan]);

    return <Provider>{children}</Provider>;
};

export const useOnboarding = <T = any,>() => useContext(OnboardingContext) as OnboardingContextValue<T>;
