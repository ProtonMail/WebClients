import { useWelcomeFlags } from '@proton/account';
import {
    StartupModals,
    useCancellationReminderModal,
    useLightLabellingFeatureModal,
    useModalState,
    useNewFeatureOnboarding,
    useReferralModal,
    useTrialEndedModal,
} from '@proton/components';
import type { StartupModal } from '@proton/components';

import { useDriveDocsFeatureFlag } from '../../store/_documents';
import { DocsSuggestionsOnboardingModal } from './DocsSuggestionsOnboardingModal';
import { DriveOnboardingV2Modal } from './DriveOnboardingV2Modal';

const useDriveOnboardingV2Modal: () => StartupModal = () => {
    const { welcomeFlags } = useWelcomeFlags();
    const [modal, setModal, renderModal] = useModalState();

    return {
        showModal: !welcomeFlags.isDone,
        activateModal: () => setModal(true),
        component: renderModal ? <DriveOnboardingV2Modal {...modal} /> : null,
    };
};

const useDocsSuggestionsOnboardingModal: () => StartupModal = () => {
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { showOnboarding, onWasShown: onDocsSuggestionModeOnboardingShown } = useNewFeatureOnboarding({
        key: 'drive-docs-suggestion-mode',
        featureFlagsEnabled: isDocsEnabled,
        shouldWelcomeFlowBeDone: true,
        startDate: '2024-11-13',
        expirationDate: '2024-12-15',
    });
    const [modal, setModal, renderModal] = useModalState({ onClose: onDocsSuggestionModeOnboardingShown });

    return {
        showModal: showOnboarding,
        activateModal: () => setModal(true),
        component: renderModal ? <DocsSuggestionsOnboardingModal {...modal} /> : null,
    };
};

const useStartupModals = () => {
    const trialEndedModal = useTrialEndedModal();
    const welcomeModal = useDriveOnboardingV2Modal();
    const docsModal = useDocsSuggestionsOnboardingModal();
    const reminderModal = useCancellationReminderModal();
    const referralModal = useReferralModal();
    const lightLabellingFeatureModal = useLightLabellingFeatureModal();

    return [trialEndedModal, welcomeModal, docsModal, reminderModal, referralModal, lightLabellingFeatureModal];
};

export const DriveStartupModals = () => {
    const modals = useStartupModals();
    return <StartupModals modals={modals} />;
};
