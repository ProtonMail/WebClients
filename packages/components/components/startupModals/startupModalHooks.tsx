import { useSubscription } from '@proton/account/subscription/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import LightLabellingFeatureModal from '@proton/components/containers/organization/logoUpload/LightLabellingFeatureModal';
import { useShowLightLabellingFeatureModal } from '@proton/components/containers/organization/logoUpload/useShowLightLabellingFeatureModal';
import CancellationReminderModal from '@proton/components/containers/payments/subscription/cancellationReminder/CancellationReminderModal';
import type { ReminderFlag } from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import { shouldOpenReminderModal } from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import TrialEndedModal from '@proton/components/containers/subscription/TrialEndedModal';
import { FeatureCode, useFeature } from '@proton/features';

import type { StartupModal } from './types';

export const useLightLabellingFeatureModal: () => StartupModal = () => {
    const [modal, setModal, renderModal] = useModalState();

    const showLightLabellingFeatureModal = useShowLightLabellingFeatureModal();

    return {
        showModal: showLightLabellingFeatureModal,
        activateModal: () => setModal(true),
        component: renderModal ? <LightLabellingFeatureModal {...modal} /> : null,
    };
};

export const useCancellationReminderModal: () => StartupModal = () => {
    const [modal, setModal, renderModal] = useModalState();

    const [subscription, subscriptionLoading] = useSubscription();
    const { feature } = useFeature<ReminderFlag>(FeatureCode.AutoDowngradeReminder);
    const showReminderModal = shouldOpenReminderModal(subscriptionLoading, subscription, feature);

    return {
        showModal: showReminderModal,
        activateModal: () => setModal(true),
        component: renderModal ? <CancellationReminderModal {...modal} /> : null,
    };
};

export const useTrialEndedModal: () => StartupModal = () => {
    const [modal, setModal, renderModal] = useModalState();

    const [userSettings] = useUserSettings();

    const displayTrialEndModal = !!userSettings?.Flags?.DisplayTrialEndModal;

    const showModal = displayTrialEndModal;

    return {
        showModal,
        activateModal: () => setModal(true),
        component: renderModal ? <TrialEndedModal {...modal} /> : null,
    };
};
