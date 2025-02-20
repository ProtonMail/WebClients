import type { FC, PropsWithChildren } from 'react';
import { Fragment, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { B2BProvider } from '@proton/pass/components/Onboarding/Provider/B2BProvider';
import { OnboardingContext } from '@proton/pass/components/Onboarding/Provider/OnboardingContext';
import { WelcomeProvider } from '@proton/pass/components/Onboarding/Provider/WelcomeProvider';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import { selectHasWritableVault, selectPassPlan } from '@proton/pass/store/selectors';

export const OnboardingProvider: FC<PropsWithChildren> = ({ children }) => {
    const plan = useSelector(selectPassPlan);
    const cantDoB2BOnboarding = useSelector(selectHasWritableVault);

    const Provider = useMemo(() => {
        if (isBusinessPlan(plan) && !cantDoB2BOnboarding) return B2BProvider;
        else if (DESKTOP_BUILD) return WelcomeProvider;
        return Fragment;
    }, [plan]);

    return <Provider>{children}</Provider>;
};

export const useOnboarding = () => useContext(OnboardingContext);
