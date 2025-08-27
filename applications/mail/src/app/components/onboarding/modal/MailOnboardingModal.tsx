import { Suspense, lazy } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import { getIsB2BAudienceFromPlan } from '@proton/payments';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash';

import MailB2COnboardingModal from 'proton-mail/components/onboarding/modal/MailB2COnboardingModal';

const B2BOnboardingModal = lazy(
    () =>
        import(
            /* webpackChunkName: "B2BOnboardingModal" */
            '@proton/components/components/onboarding/b2b/B2BOnboardingModal'
        )
);

export interface MailOnboardingProps {
    hideDiscoverApps?: boolean;
    showGenericSteps?: boolean;
    onClose?: () => void;
    onDone?: () => void;
    onExit?: () => void;
    open?: boolean;
}

const MailOnboardingModal = ({ hideDiscoverApps, showGenericSteps, ...props }: MailOnboardingProps) => {
    const [organization] = useOrganization();
    const [user] = useUser();
    const b2bOnboardingEnabled = useFlag('B2BOnboarding');

    const isB2BAdmin = isAdmin(user) && getIsB2BAudienceFromPlan(organization?.PlanName);

    if (isB2BAdmin && b2bOnboardingEnabled) {
        return (
            <ErrorBoundary>
                <Suspense fallback={null}>
                    <B2BOnboardingModal source="onboarding" {...props} />
                </Suspense>
            </ErrorBoundary>
        );
    }

    return (
        <MailB2COnboardingModal hideDiscoverApps={hideDiscoverApps} showGenericSteps={showGenericSteps} {...props} />
    );
};

export default MailOnboardingModal;
