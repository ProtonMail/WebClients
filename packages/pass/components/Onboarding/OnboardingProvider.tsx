import type { FC, PropsWithChildren } from 'react';
import { Fragment, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { isBusinessPlan } from '../../lib/organization/helpers';
import { selectCanCreateItems } from '../../store/selectors/shares';
import { selectPassPlan } from '../../store/selectors/user';
import { B2BProvider } from './Provider/B2BProvider';
import { WelcomeProvider } from './Provider/WelcomeProvider';

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

export { useOnboarding } from './Provider/OnboardingContext';
