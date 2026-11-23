import { Suspense, lazy } from 'react';

import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import StartupModals from '@proton/components/components/startupModals/StartupModals';
import {
    useLightLabellingFeatureModal,
    useScimGroupsOnboardingModal,
} from '@proton/components/components/startupModals/startupModalHooks';
import type { StartupModal } from '@proton/components/components/startupModals/types';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import useIsB2BAdmin from '@proton/components/hooks/useIsB2BAdmin';
import { useOfferStartupModal } from '@proton/offers-delivery/components/useOfferStartupModal';
import { useTrialInfo } from '@proton/payments-hooks/ui/hooks/useTrialInfo';
import { useTrialEndedModal } from '@proton/payments-ui/containers/subscription/useTrialEndedModal';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

const B2BOnboardingModal = lazy(
    () =>
        import(
            /* webpackChunkName: "B2BOnboardingModal" */
            '@proton/components/components/onboarding/b2b/B2BOnboardingModal'
        )
);

const useB2BOnboardingModal: () => StartupModal = () => {
    const [modal, setModal, renderModal] = useModalState();
    const { welcomeFlags } = useWelcomeFlags();
    const isB2BAdmin = useIsB2BAdmin();
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
    const offerModal = useOfferStartupModal();
    return [trialEndedModal, b2bOnboardingModal, lightLabellingFeatureModal, scimGroupsOnboardingModal, offerModal];
};

const AccountStartupModals = () => {
    const modals = useStartupModals();

    if (isElectronMail) {
        return null;
    }

    return <StartupModals modals={modals} />;
};

export default AccountStartupModals;
