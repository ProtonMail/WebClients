import { useEffect, useRef } from 'react';
import { APPS } from '@proton/shared/lib/constants';
import {
    useModalState,
    ReferralModal,
    useSubscription,
    useUser,
    useFeature,
    FeatureCode,
    getShouldOpenReferralModal,
    useAddresses,
    getShouldOpenMnemonicModal,
    V5WelcomeModal,
    useShouldOpenV5WelcomeModal,
} from '@proton/components';
import { MnemonicPromptModal } from '@proton/components/containers/mnemonic';

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
        }
    }, [shouldOpenMnemonicModal, shouldOpenReferralModal.open, shouldOpenV5WelcomeModal]);

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
        </>
    );
};

export default MailStartupModals;
