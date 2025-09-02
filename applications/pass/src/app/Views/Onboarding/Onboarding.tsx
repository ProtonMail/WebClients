import type { FC } from 'react';
import { Redirect } from 'react-router-dom';

import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useOnboarding } from '@proton/pass/components/Onboarding/OnboardingProvider';
import { B2BOnboarding } from '@proton/pass/components/Onboarding/Panel/B2BOnboarding';

export const Onboarding: FC = () => {
    const { enabled } = useOnboarding();

    return enabled ? (
        <div className="flex flex-column justify-center w-full h-full">
            <B2BOnboarding />
        </div>
    ) : (
        <Redirect to={getLocalPath()} push={false} />
    );
};
