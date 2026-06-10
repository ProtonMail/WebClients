import { useWelcomeFlags } from '@proton/account';
import {
    StartupModals,
    useCancellationReminderModal,
    useLightLabellingFeatureModal,
    useModalState,
    useNewFeatureOnboarding,
    useTrialEndedModal,
} from '@proton/components';
import type { StartupModal } from '@proton/components';
import { useNetPromoterScoreModal } from '@proton/components/components/startupModals/startupModalHooks';
import { NPSApplication } from '@proton/components/containers/netPromoterScore/interface';

import { useDriveDocsFeatureFlag } from '../../../legacy/store/_documents';
import { DriveOnboardingModal } from '../../../modals/DriveOnboardingModal';
import { DocsSuggestionsOnboardingModal } from './DocsSuggestionsOnboardingModal';

const useDriveOnboardingModal: () => StartupModal = () => {
    const { welcomeFlags } = useWelcomeFlags();
    const [modal, setModal, renderModal] = useModalState();

    return {
        showModal: !welcomeFlags.isDone,
        activateModal: () => setModal(true),
        component: renderModal ? <DriveOnboardingModal {...modal} /> : null,
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
    const welcomeModal = useDriveOnboardingModal();
    const docsModal = useDocsSuggestionsOnboardingModal();
    const reminderModal = useCancellationReminderModal();
    const lightLabellingFeatureModal = useLightLabellingFeatureModal();
    const netPromoterScoreModal = useNetPromoterScoreModal(NPSApplication.WebDrive);

    return [trialEndedModal, welcomeModal, docsModal, reminderModal, lightLabellingFeatureModal, netPromoterScoreModal];
};

export const DriveStartupModals = () => {
    const modals = useStartupModals();
    return <StartupModals modals={modals} />;
};
