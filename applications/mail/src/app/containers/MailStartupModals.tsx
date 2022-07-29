import { useEffect, useRef } from 'react';

import {
    FeatureCode,
    RebrandingFeedbackModal,
    ReferralModal,
    V5WelcomeModal,
    getShouldOpenMnemonicModal,
    getShouldOpenReferralModal,
    useAddresses,
    useFeature,
    useModalState,
    useRebrandingFeedback,
    useShouldOpenV5WelcomeModal,
    useSubscription,
    useUser,
} from '@proton/components';
import { MnemonicPromptModal } from '@proton/components/containers/mnemonic';
import { APPS } from '@proton/shared/lib/constants';

import MailOnboardingModal from '../components/onboarding/MailOnboardingModal';

interface Props {
    onboardingOpen: boolean;
    onOnboardingDone: () => void;
}

const MailStartupModals = ({ onboardingOpen, onOnboardingDone }: Props) => {
    const app = APPS.PROTONMAIL;

    // Onboarding modal
    const [onboardingModal, setOnboardingModal, renderOnboardingModal] = useModalState();

    // Mnemonic modal
    const [user] = useUser();
    const [addresses] = useAddresses();
    const seenMnemonicFeature = useFeature<boolean>(FeatureCode.SeenMnemonicPrompt);
    const [mnemonicPromptModal, setMnemonicPromptModalOpen, renderMnemonicModal] = useModalState();
    const shouldOpenMnemonicModal = getShouldOpenMnemonicModal({
        user,
        addresses,
        feature: seenMnemonicFeature.feature,
        app,
    });

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

        if (onboardingOpen) {
            openModal(setOnboardingModal);
        } else if (shouldOpenMnemonicModal) {
            openModal(setMnemonicPromptModalOpen);
        } else if (shouldOpenReferralModal.open) {
            openModal(setReferralModal);
        } else if (shouldOpenV5WelcomeModal) {
            openModal(setV5WelcomeModal);
        } else if (handleRebrandingFeedbackModalDisplay) {
            openModal(setRebrandingFeedbackModal);
        }
    }, [
        shouldOpenMnemonicModal,
        shouldOpenReferralModal.open,
        shouldOpenV5WelcomeModal,
        handleRebrandingFeedbackModalDisplay,
    ]);

    return (
        <>
            {renderOnboardingModal && (
                <MailOnboardingModal
                    onDone={() => {
                        onOnboardingDone();
                        onboardingModal.onClose();
                    }}
                    onExit={onboardingModal.onExit}
                    open={onboardingModal.open}
                />
            )}
            {renderReferralModal && <ReferralModal endDate={shouldOpenReferralModal.endDate} {...referralModal} />}
            {renderMnemonicModal && <MnemonicPromptModal {...mnemonicPromptModal} />}
            {renderV5WelcomeModal && <V5WelcomeModal app={app} {...v5WelcomeModal} />}
            {renderRebrandingFeedbackModal && (
                <RebrandingFeedbackModal onMount={handleRebrandingFeedbackModalDisplay} {...rebrandingFeedbackModal} />
            )}
        </>
    );
};

export default MailStartupModals;
