import { useEffect, useRef } from 'react';
import { APPS } from '@proton/shared/lib/constants';
import {
    useModalState,
    ReferralModal,
    useSubscription,
    useFeature,
    FeatureCode,
    getShouldOpenReferralModal,
    V5WelcomeModal,
    useShouldOpenV5WelcomeModal,
    useRebrandingFeedback,
    RebrandingFeedbackModal,
} from '@proton/components';

const DriveStartupModals = () => {
    const app = APPS.PROTONDRIVE;

    // Referral modal
    const [subscription] = useSubscription();
    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const [referralModal, setReferralModal, renderReferralModal] = useModalState();
    const shouldOpenReferralModal = getShouldOpenReferralModal({ subscription, feature: seenReferralModal.feature });

    // V5 welcome modal
    const [v5WelcomeModal, setV5WelcomeModal, renderV5WelcomeModal] = useModalState();
    const shouldOpenV5WelcomeModal = useShouldOpenV5WelcomeModal();

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
            openModal(setReferralModal);
        } else if (shouldOpenV5WelcomeModal) {
            openModal(setV5WelcomeModal);
        } else if (handleRebrandingFeedbackModalDisplay) {
            openModal(setRebrandingFeedbackModal);
        }
    }, [shouldOpenReferralModal.open, shouldOpenV5WelcomeModal, handleRebrandingFeedbackModalDisplay]);

    return (
        <>
            {renderReferralModal && <ReferralModal endDate={shouldOpenReferralModal.endDate} {...referralModal} />}
            {renderV5WelcomeModal && <V5WelcomeModal app={app} {...v5WelcomeModal} />}
            {renderRebrandingFeedbackModal && (
                <RebrandingFeedbackModal onMount={handleRebrandingFeedbackModalDisplay} {...rebrandingFeedbackModal} />
            )}
        </>
    );
};

export default DriveStartupModals;
