import { useEffect, useRef } from 'react';

import {
    CancellationReminderModal,
    FeatureCode,
    LightLabellingFeatureModal,
    RebrandingFeedbackModal,
    getShouldOpenReferralModal,
    useFeature,
    useModalState,
    useRebrandingFeedback,
    useShowLightLabellingFeatureModal,
    useSubscription,
} from '@proton/components';
import {
    ReminderFlag,
    shouldOpenReminderModal,
} from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import { OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';

const DriveStartupModals = () => {
    // Referral modal
    const [subscription, subscriptionLoading] = useSubscription();
    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const shouldOpenReferralModal = getShouldOpenReferralModal({ subscription, feature: seenReferralModal.feature });

    // Cancellation reminder modals
    const { feature } = useFeature<ReminderFlag>(FeatureCode.AutoDowngradeReminder);
    const [reminderModal, setReminderModal, renderReminderModal] = useModalState();
    const openReminderModal = shouldOpenReminderModal(subscriptionLoading, subscription, feature);

    const [rebrandingFeedbackModal, setRebrandingFeedbackModal, renderRebrandingFeedbackModal] = useModalState();
    const handleRebrandingFeedbackModalDisplay = useRebrandingFeedback();

    const showLightLabellingFeatureModal = useShowLightLabellingFeatureModal();
    const [lightLabellingFeatureModalProps, setLightLabellingFeatureModal, renderLightLabellingFeatureModal] =
        useModalState();

    const onceRef = useRef(false);
    useEffect(() => {
        if (onceRef.current) {
            return;
        }

        const openModal = (setModalOpen: (newValue: boolean) => void) => {
            onceRef.current = true;
            setModalOpen(true);
        };

        if (openReminderModal) {
            openModal(setReminderModal);
        } else if (shouldOpenReferralModal.open) {
            onceRef.current = true;
            document.dispatchEvent(new CustomEvent(OPEN_OFFER_MODAL_EVENT));
        } else if (showLightLabellingFeatureModal) {
            onceRef.current = true;
            setLightLabellingFeatureModal(true);
        } else if (handleRebrandingFeedbackModalDisplay) {
            openModal(setRebrandingFeedbackModal);
        }
    }, [
        shouldOpenReferralModal.open,
        showLightLabellingFeatureModal,
        handleRebrandingFeedbackModalDisplay,
        openReminderModal,
    ]);

    return (
        <>
            {renderReminderModal && <CancellationReminderModal {...reminderModal} />}
            {renderLightLabellingFeatureModal && <LightLabellingFeatureModal {...lightLabellingFeatureModalProps} />}
            {renderRebrandingFeedbackModal && (
                <RebrandingFeedbackModal onMount={handleRebrandingFeedbackModalDisplay} {...rebrandingFeedbackModal} />
            )}
        </>
    );
};

export default DriveStartupModals;
