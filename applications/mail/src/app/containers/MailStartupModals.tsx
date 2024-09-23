import { useEffect, useRef } from 'react';

import { EasySwitchProvider } from '@proton/activation';
import {
    CancellationReminderModal,
    FeatureCode,
    InboxDesktopFreeTrialOnboardingModal,
    LightLabellingFeatureModal,
    getShouldOpenReferralModal,
    useFeature,
    useModalState,
    useShowLightLabellingFeatureModal,
    useSubscription,
    useUser,
    useWelcomeFlags,
} from '@proton/components';
import type { ReminderFlag } from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import { shouldOpenReminderModal } from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import { OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import MailOnboardingModal from '../components/onboarding/modal/MailOnboardingModal';

const MailStartupModals = () => {
    const [subscription, subscriptionLoading] = useSubscription();

    // Onboarding modal
    const [user] = useUser();
    const [onboardingModal, setOnboardingModal, renderOnboardingModal] = useModalState();

    // Cancellation reminder modals
    const { feature } = useFeature<ReminderFlag>(FeatureCode.AutoDowngradeReminder);
    const [reminderModal, setReminderModal, renderReminderModal] = useModalState();
    const openReminderModal = shouldOpenReminderModal(subscriptionLoading, subscription, feature);

    // Referral modal
    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const shouldOpenReferralModal = getShouldOpenReferralModal({ subscription, feature: seenReferralModal.feature });

    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const onboardingOpen = !welcomeFlags.isDone;

    const showLightLabellingFeatureModal = useShowLightLabellingFeatureModal();
    const [lightLabellingFeatureModalProps, setLightLabellingFeatureModal, renderLightLabellingFeatureModal] =
        useModalState();

    const onceRef = useRef(false);
    useEffect(() => {
        if (onceRef.current || isElectronMail) {
            return;
        }

        const openModal = (setModalOpen: (newValue: boolean) => void) => {
            onceRef.current = true;
            setModalOpen(true);
        };

        if (openReminderModal) {
            openModal(setReminderModal);
        } else if (onboardingOpen) {
            openModal(setOnboardingModal);
        } else if (shouldOpenReferralModal.open) {
            onceRef.current = true;
            document.dispatchEvent(new CustomEvent(OPEN_OFFER_MODAL_EVENT));
        } else if (showLightLabellingFeatureModal) {
            onceRef.current = true;
            setLightLabellingFeatureModal(true);
        }
    }, [shouldOpenReferralModal.open, showLightLabellingFeatureModal, onboardingOpen, openReminderModal]);

    return (
        <>
            {renderReminderModal && <CancellationReminderModal {...reminderModal} />}
            {isElectronMail && !user.hasPaidMail && <InboxDesktopFreeTrialOnboardingModal />}
            {renderOnboardingModal && (
                <EasySwitchProvider>
                    <MailOnboardingModal
                        onDone={() => {
                            setWelcomeFlagsDone();
                            onboardingModal.onClose();
                        }}
                        onExit={onboardingModal.onExit}
                        open={onboardingModal.open}
                        hideDiscoverApps
                    />
                </EasySwitchProvider>
            )}
            {renderLightLabellingFeatureModal && <LightLabellingFeatureModal {...lightLabellingFeatureModalProps} />}
        </>
    );
};

export default MailStartupModals;
