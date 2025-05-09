import type { FC, PropsWithChildren } from 'react';
import { Fragment, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { B2BProvider } from '@proton/pass/components/Onboarding/Provider/B2BProvider';
import { OnboardingContext, OnboardingType } from '@proton/pass/components/Onboarding/Provider/OnboardingContext';
import { createWelcomeProvider } from '@proton/pass/components/Onboarding/Provider/WelcomeProvider';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import { selectCanCreateItems, selectPassPlan } from '@proton/pass/store/selectors';
import { SpotlightMessage } from '@proton/pass/types';

export const OnboardingProvider: FC<PropsWithChildren> = ({ children }) => {
    const plan = useSelector(selectPassPlan);
    const canCreateItems = useSelector(selectCanCreateItems);

    const Provider = useMemo(() => {
        if (isBusinessPlan(plan)) return canCreateItems ? B2BProvider : Fragment;
        if (EXTENSION_BUILD) return Fragment;
        return createWelcomeProvider({
            message: DESKTOP_BUILD ? SpotlightMessage.WELCOME : SpotlightMessage.WEB_ONBOARDING,
            type: DESKTOP_BUILD ? OnboardingType.WELCOME : OnboardingType.WEB_ONBOARDING,
        });
    }, [plan]);

    return <Provider>{children}</Provider>;
};

export const useOnboarding = () => useContext(OnboardingContext);
