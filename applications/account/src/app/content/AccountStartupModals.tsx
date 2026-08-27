import { Suspense, lazy } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import {
    type StartupModal,
    StartupModals,
    useLightLabellingFeatureModal,
    useModalState,
    useScimGroupsOnboardingModal,
    useTrialEndedModal,
} from '@proton/components';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import { useTrialInfo } from '@proton/payments-ui/ui/hooks/useTrialInfo';
import { getIsB2BAudienceFromPlan } from '@proton/payments/core/plan/helpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { isAdmin } from '@proton/shared/lib/user/helpers';

const B2BOnboardingModal = lazy(
    () =>
        import(
            /* webpackChunkName: "B2BOnboardingModal" */
            '@proton/components/components/onboarding/b2b/B2BOnboardingModal'
        )
);

const useB2BOnboardingModal: () => StartupModal = () => {
    const [modal, setModal, renderModal] = useModalState();
    const [user] = useUser();
    const [organization] = useOrganization();

    const { welcomeFlags } = useWelcomeFlags();
    const isB2BAdmin = isAdmin(user) && getIsB2BAudienceFromPlan(organization?.PlanName);
    const { hasAtLeastOneB2BTrial } = useTrialInfo();
    const onboardingOpen = (!welcomeFlags.isDone || welcomeFlags.isReplay) && isB2BAdmin && !!hasAtLeastOneB2BTrial;

    return {
        showModal: onboardingOpen,
        activateModal: () => setModal(true),
        component: renderModal ? (
            <ErrorBoundary>
                <Suspense fallback={null}>
                    <B2BOnboardingModal
                        source="onboarding"
                        onExit={modal.onExit}
                        open={modal.open}
                        onClose={modal.onClose}
                    />
                </Suspense>
            </ErrorBoundary>
        ) : null,
    };
};

const useStartupModals = () => {
    const trialEndedModal = useTrialEndedModal();
    const b2bOnboardingModal = useB2BOnboardingModal();
    const lightLabellingFeatureModal = useLightLabellingFeatureModal();
    const scimGroupsOnboardingModal = useScimGroupsOnboardingModal();
    return [trialEndedModal, b2bOnboardingModal, lightLabellingFeatureModal, scimGroupsOnboardingModal];
};

const AccountStartupModals = () => {
    const modals = useStartupModals();

    if (isElectronMail) {
        return null;
    }

    return <StartupModals modals={modals} />;
};

export default AccountStartupModals;
