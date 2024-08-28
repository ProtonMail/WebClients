import { useEffect, useRef } from 'react';

import {
    CancellationReminderModal,
    FeatureCode,
    LightLabellingFeatureModal,
    getShouldOpenReferralModal,
    useFeature,
    useModalState,
    useNewFeatureOnboarding,
    useShowLightLabellingFeatureModal,
    useSubscription,
    useWelcomeFlags,
} from '@proton/components';
import type { ReminderFlag } from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import { shouldOpenReminderModal } from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import { OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';

import { useDriveDocsFeatureFlag } from '../../store/_documents';
import DriveDocsOnboardingModal from './DriveDocsOnboardingModal';
import { DriveOnboardingModal } from './DriveOnboardingModal';

const DriveStartupModals = () => {
    // Drive welcome modal
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const showWelcomeModal = !welcomeFlags.isDone;
    const [welcomeModal, setWelcomeModal, renderWelcomeModal] = useModalState();

    // Docs welcome modal
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { showOnboarding: showDocsOnboarding, onWasShown: onDocsOnboardingShown } = useNewFeatureOnboarding({
        key: 'drive-docs',
        featureFlagsEnabled: isDocsEnabled,
        shouldWelcomeFlowBeDone: true,
        startDate: '2024-08-15',
        expirationDate: '2024-08-31',
    });
    const [docsModal, setDocsModal, renderDocsModal] = useModalState({
        onClose: onDocsOnboardingShown,
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
            [showWelcomeModal, setWelcomeModal],
            [showDocsOnboarding, setDocsModal],
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
    }, [showWelcomeModal, showDocsOnboarding, showReminderModal, showReferralModal, showLightLabellingFeatureModal]);

    return (
        <>
            {/* Drive modals */}
            {renderWelcomeModal && <DriveOnboardingModal {...welcomeModal} onDone={setWelcomeFlagsDone} />}
            {renderDocsModal && <DriveDocsOnboardingModal {...docsModal} />}

            {/* Account modals */}
            {renderReminderModal && <CancellationReminderModal {...reminderModal} />}
            {renderLightLabellingFeatureModal && <LightLabellingFeatureModal {...lightLabellingFeatureModalProps} />}
        </>
    );
};

export default DriveStartupModals;
