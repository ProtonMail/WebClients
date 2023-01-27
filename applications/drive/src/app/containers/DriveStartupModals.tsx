import { useEffect, useRef } from 'react';

import {
    FeatureCode,
    RebrandingFeedbackModal,
    getShouldOpenReferralModal,
    useFeature,
    useModalState,
    useRebrandingFeedback,
    useSubscription,
} from '@proton/components';
import { OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';

const DriveStartupModals = () => {
    // Referral modal
    const [subscription] = useSubscription();
    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const shouldOpenReferralModal = getShouldOpenReferralModal({ subscription, feature: seenReferralModal.feature });

    const [rebrandingFeedbackModal, setRebrandingFeedbackModal, renderRebrandingFeedbackModal] = useModalState();
    const handleRebrandingFeedbackModalDisplay = useRebrandingFeedback();

    const onceRef = useRef(false);
    useEffect(() => {
        if (onceRef.current) {
            return;
        }

        const openModal = (setModalOpen: (newValue: boolean) => void) => {
            onceRef.current = true;
            setModalOpen(true);
        };

        if (shouldOpenReferralModal.open) {
            onceRef.current = true;
            document.dispatchEvent(new CustomEvent(OPEN_OFFER_MODAL_EVENT));
        } else if (handleRebrandingFeedbackModalDisplay) {
            openModal(setRebrandingFeedbackModal);
        }
    }, [shouldOpenReferralModal.open, handleRebrandingFeedbackModalDisplay]);

    return (
        <>
            {renderRebrandingFeedbackModal && (
                <RebrandingFeedbackModal onMount={handleRebrandingFeedbackModalDisplay} {...rebrandingFeedbackModal} />
            )}
        </>
    );
};

export default DriveStartupModals;
