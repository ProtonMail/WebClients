import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';

import {
    CancellationReminderModal,
    LightLabellingFeatureModal,
    getShouldOpenReferralModal,
    shouldOpenReminderModal,
    useModalState,
    useShowLightLabellingFeatureModal,
    useSubscription,
} from '@proton/components';
import type { ReminderFlag } from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import { FeatureCode, useFeature } from '@proton/features';
import { OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

interface Props {
    setStartupModalState: Dispatch<SetStateAction<{ hasModal?: boolean; isOpen: boolean }>>;
}

const CalendarStartupModals = ({ setStartupModalState }: Props) => {
    // Referral modal
    const [subscription, subscriptionLoading] = useSubscription();
    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const shouldOpenReferralModal = getShouldOpenReferralModal({ subscription, feature: seenReferralModal.feature });

    // Cancellation reminder modals
    const { feature } = useFeature<ReminderFlag>(FeatureCode.AutoDowngradeReminder);
    const [reminderModal, setReminderModal, renderReminderModal] = useModalState();
    const openReminderModal = shouldOpenReminderModal(subscriptionLoading, subscription, feature);

    const showLightLabellingFeatureModal = useShowLightLabellingFeatureModal();
    const [lightLabellingFeatureModalProps, setLightLabellingFeatureModal, renderLightLabellingFeatureModal] =
        useModalState();

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

        if (openReminderModal) {
            openModal(setReminderModal);
        } else if (shouldOpenReferralModal.open) {
            onceRef.current = true;
            setStartupModalState({ hasModal: true, isOpen: true });
            document.dispatchEvent(new CustomEvent(OPEN_OFFER_MODAL_EVENT));
        } else if (showLightLabellingFeatureModal) {
            onceRef.current = true;
            setLightLabellingFeatureModal(true);
        } else {
            setStartupModalState({ hasModal: false, isOpen: false });
        }
    }, [shouldOpenReferralModal.open, showLightLabellingFeatureModal, openReminderModal]);

    return (
        <>
            {renderReminderModal && <CancellationReminderModal {...reminderModal} />}
            {renderLightLabellingFeatureModal && <LightLabellingFeatureModal {...lightLabellingFeatureModalProps} />}
        </>
    );
};

export default CalendarStartupModals;
