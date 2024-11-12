import { useEffect, useRef } from 'react';

import { useWelcomeFlags } from '@proton/account';
import { useSubscription } from '@proton/account/subscription/hooks';
import {
    CancellationReminderModal,
    LightLabellingFeatureModal,
    getShouldOpenReferralModal,
    shouldOpenReminderModal,
    useModalState,
    useShowLightLabellingFeatureModal,
} from '@proton/components';
import type { ReminderFlag } from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import { FeatureCode, useFeature } from '@proton/features';
import { OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import { DriveOnboardingModal } from './DriveOnboardingModal';
import { DriveOnboardingV2Modal } from './DriveOnboardingV2Modal';

const DriveStartupModals = () => {
    const { welcomeFlags, setDone: setWelcomeFlagsDone } = useWelcomeFlags();
    const isOnboardingV2 = useFlag('DriveWebOnboardingV2');

    // Drive onboarding V2
    const showWelcomeV2Modal = !welcomeFlags.isDone && isOnboardingV2;
    const [welcomeV2Modal, setWelcomeV2Modal, renderWelcomeV2Modal] = useModalState();

    // Drive welcome modal
    const showWelcomeModal = !welcomeFlags.isDone && !isOnboardingV2;
    const [welcomeModal, setWelcomeModal, renderWelcomeModal] = useModalState();

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
            [showWelcomeV2Modal, setWelcomeV2Modal],
            [showWelcomeModal, setWelcomeModal],
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
    }, [showWelcomeV2Modal, showWelcomeModal, showReminderModal, showReferralModal, showLightLabellingFeatureModal]);

    return (
        <>
            {/* Drive modals */}
            {renderWelcomeV2Modal && <DriveOnboardingV2Modal {...welcomeV2Modal} />}
            {renderWelcomeModal && <DriveOnboardingModal {...welcomeModal} onDone={setWelcomeFlagsDone} />}

            {/* Account modals */}
            {renderReminderModal && <CancellationReminderModal {...reminderModal} />}
            {renderLightLabellingFeatureModal && <LightLabellingFeatureModal {...lightLabellingFeatureModalProps} />}
        </>
    );
};

export default DriveStartupModals;
