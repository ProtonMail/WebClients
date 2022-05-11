import { Dispatch, SetStateAction, useEffect, useRef } from 'react';

import {
    FeatureCode,
    RebrandingFeedbackModal,
    ReferralModal,
    V5WelcomeModal,
    getShouldOpenReferralModal,
    useFeature,
    useModalState,
    useRebrandingFeedback,
    useShouldOpenV5WelcomeModal,
    useSubscription,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

interface Props {
    setStartupModalState: Dispatch<SetStateAction<{ hasModal?: boolean; isOpen: boolean }>>;
}

const CalendarStartupModals = ({ setStartupModalState }: Props) => {
    const app = APPS.PROTONCALENDAR;

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

    const onCloseWithState = (onClose: () => void) => () => {
        onClose();
        setStartupModalState((state) => ({ ...state, isOpen: false }));
    };

    const onceRef = useRef(false);
    useEffect(() => {
        if (onceRef.current) {
            return;
        }

        const openModal = (setModalOpen: (newValue: boolean) => void) => {
            onceRef.current = true;
            setModalOpen(true);
            setStartupModalState({ hasModal: true, isOpen: true });
        };

        if (shouldOpenReferralModal.open) {
            openModal(setReferralModal);
        } else if (shouldOpenV5WelcomeModal) {
            openModal(setV5WelcomeModal);
        } else if (handleRebrandingFeedbackModalDisplay) {
            openModal(setRebrandingFeedbackModal);
        } else {
            setStartupModalState({ hasModal: false, isOpen: false });
        }
    }, [shouldOpenReferralModal.open, shouldOpenV5WelcomeModal, handleRebrandingFeedbackModalDisplay]);

    return (
        <>
            {renderReferralModal && (
                <ReferralModal
                    endDate={shouldOpenReferralModal.endDate}
                    {...referralModal}
                    onClose={onCloseWithState(referralModal.onClose)}
                />
            )}
            {renderV5WelcomeModal && (
                <V5WelcomeModal app={app} {...v5WelcomeModal} onClose={onCloseWithState(v5WelcomeModal.onClose)} />
            )}
            {renderRebrandingFeedbackModal && (
                <RebrandingFeedbackModal
                    onMount={handleRebrandingFeedbackModalDisplay}
                    {...rebrandingFeedbackModal}
                    onClose={onCloseWithState(rebrandingFeedbackModal.onClose)}
                />
            )}
        </>
    );
};

export default CalendarStartupModals;
