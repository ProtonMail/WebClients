import { Dispatch, SetStateAction, useEffect, useRef } from 'react';

import {
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
import { OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

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

    const showLightLabellingFeatureModal = useShowLightLabellingFeatureModal();
    const [lightLabellingFeatureModalProps, setLightLabellingFeatureModal, renderLightLabellingFeatureModal] =
        useModalState();

    const onCloseWithState = (onClose: () => void) => () => {
        onClose();
        setStartupModalState((state) => ({ ...state, isOpen: false }));
    };

    const onceRef = useRef(false);
    useEffect(() => {
        if (onceRef.current) {
            return;
        }

        if (isElectronMail) {
            setStartupModalState({ hasModal: false, isOpen: false });
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
        } else if (showLightLabellingFeatureModal) {
            onceRef.current = true;
            setLightLabellingFeatureModal(true);
        } else if (handleRebrandingFeedbackModalDisplay) {
            openModal(setRebrandingFeedbackModal);
        } else {
            setStartupModalState({ hasModal: false, isOpen: false });
        }
    }, [shouldOpenReferralModal.open, showLightLabellingFeatureModal, handleRebrandingFeedbackModalDisplay]);

    return (
        <>
            {renderLightLabellingFeatureModal && (
                <LightLabellingFeatureModal {...lightLabellingFeatureModalProps} />
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
