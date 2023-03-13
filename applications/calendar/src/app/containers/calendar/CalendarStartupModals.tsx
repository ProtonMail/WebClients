import { Dispatch, SetStateAction, useEffect, useRef } from 'react';

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

interface Props {
    setStartupModalState: Dispatch<SetStateAction<{ hasModal?: boolean; isOpen: boolean }>>;
}

const CalendarStartupModals = ({ setStartupModalState }: Props) => {
    // Referral modal
    const [subscription] = useSubscription();
    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const shouldOpenReferralModal = getShouldOpenReferralModal({ subscription, feature: seenReferralModal.feature });

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
            onceRef.current = true;
            setStartupModalState({ hasModal: true, isOpen: true });
            document.dispatchEvent(new CustomEvent(OPEN_OFFER_MODAL_EVENT));
        } else if (handleRebrandingFeedbackModalDisplay) {
            openModal(setRebrandingFeedbackModal);
        } else {
            setStartupModalState({ hasModal: false, isOpen: false });
        }
    }, [shouldOpenReferralModal.open, handleRebrandingFeedbackModalDisplay]);

    return (
        <>
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
