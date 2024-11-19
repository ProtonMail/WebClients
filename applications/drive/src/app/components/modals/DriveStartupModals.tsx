import { useEffect, useRef } from 'react';

import { useWelcomeFlags } from '@proton/account';
import { useSubscription } from '@proton/account/subscription/hooks';
import {
    CancellationReminderModal,
    LightLabellingFeatureModal,
    getShouldOpenReferralModal,
    shouldOpenReminderModal,
    useModalState,
    useNewFeatureOnboarding,
    useShowLightLabellingFeatureModal,
} from '@proton/components';
import type { ReminderFlag } from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import { FeatureCode, useFeature } from '@proton/features';
import { OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';

import { useDriveDocsFeatureFlag } from '../../store/_documents';
import { DocsSuggestionsOnboardingModal } from './DocsSuggestionsOnboardingModal';
import { DriveOnboardingV2Modal } from './DriveOnboardingV2Modal';

const DriveStartupModals = () => {
    const { welcomeFlags } = useWelcomeFlags();

    // Drive onboarding V2
    const showWelcomeV2Modal = !welcomeFlags.isDone;
    const [welcomeV2Modal, setWelcomeV2Modal, renderWelcomeV2Modal] = useModalState();

    // Docs welcome modal
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { showOnboarding: showDocsSuggestionModeOnboarding, onWasShown: onDocsSuggestionModeOnboardingShown } =
        useNewFeatureOnboarding({
            key: 'drive-docs-suggestion-mode',
            featureFlagsEnabled: isDocsEnabled,
            shouldWelcomeFlowBeDone: true,
            startDate: '2024-11-13',
            expirationDate: '2024-12-15',
        });
    const [docsModal, setDocsModal, renderDocsModal] = useModalState({
        onClose: onDocsSuggestionModeOnboardingShown,
    });

    // Referral modal
    const [subscription, subscriptionLoading] = useSubscription();
    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const { open: showReferralModal } = getShouldOpenReferralModal({
        subscription,
        feature: seenReferralModal.feature,
    });
    const setReferralModal = () => {
        document.dispatchEvent(new CustomEvent(OPEN_OFFER_MODAL_EVENT));
    };

    // Cancellation reminder modal
    const { feature } = useFeature<ReminderFlag>(FeatureCode.AutoDowngradeReminder);
    const [reminderModal, setReminderModal, renderReminderModal] = useModalState();
    const showReminderModal = shouldOpenReminderModal(subscriptionLoading, subscription, feature);

    // Light labelling modal
    const showLightLabellingFeatureModal = useShowLightLabellingFeatureModal();
    const [lightLabellingFeatureModalProps, setLightLabellingFeatureModal, renderLightLabellingFeatureModal] =
        useModalState();

    // This ref ensures only one modal is shown at a time
    const onceRef = useRef(false);

    useEffect(() => {
        if (onceRef.current) {
            return;
        }

        // Modals by order of priority, top-most will be prioritized
        const modals: [boolean, (value: boolean) => void][] = [
            // Drive modals
            [showWelcomeV2Modal, setWelcomeV2Modal],
            // Docs modals
            [showDocsSuggestionModeOnboarding, setDocsModal],
            // Account modals
            [showReminderModal, setReminderModal],
            [showReferralModal, setReferralModal],
            [showLightLabellingFeatureModal, setLightLabellingFeatureModal],
        ];

        for (const [show, setModalOpen] of modals) {
            if (show) {
                onceRef.current = true;
                setModalOpen(true);

                break;
            }
        }
    }, [
        showWelcomeV2Modal,
        showReminderModal,
        showReferralModal,
        showLightLabellingFeatureModal,
        showDocsSuggestionModeOnboarding,
    ]);

    return (
        <>
            {/* Drive modals */}
            {renderWelcomeV2Modal && <DriveOnboardingV2Modal {...welcomeV2Modal} />}

            {/* Docs modals */}
            {renderDocsModal && <DocsSuggestionsOnboardingModal {...docsModal} />}

            {/* Account modals */}
            {renderReminderModal && <CancellationReminderModal {...reminderModal} />}
            {renderLightLabellingFeatureModal && <LightLabellingFeatureModal {...lightLabellingFeatureModalProps} />}
        </>
    );
};

export default DriveStartupModals;
