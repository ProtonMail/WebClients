import { useSubscription } from '@proton/account/subscription/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import NetPromoterScoreModal from '@proton/components/containers/netPromoterScore/NetPromoterScoreModal';
import { useNPSEligiblity } from '@proton/components/containers/netPromoterScore/hooks/useNPSEligibility';
import ScimGroupsOnboardingModal from '@proton/components/containers/organization/ScimGroupsOnboardingModal';
import LightLabellingFeatureModal from '@proton/components/containers/organization/logoUpload/LightLabellingFeatureModal';
import { useShowLightLabellingFeatureModal } from '@proton/components/containers/organization/logoUpload/useShowLightLabellingFeatureModal';
import { useShowScimGroupsOnboardingModal } from '@proton/components/containers/organization/useShowScimGroupsOnboardingModal';
import CancellationReminderModal from '@proton/components/containers/payments/subscription/cancellationReminder/CancellationReminderModal';
import type { ReminderFlag } from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import { shouldOpenReminderModal } from '@proton/components/containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import TrialEndedModal from '@proton/components/containers/subscription/TrialEndedModal';
import { FeatureCode, useFeature } from '@proton/features';

import { npsConfig } from '../../containers/netPromoterScore/config';
import { getFeatureCode } from '../../containers/netPromoterScore/helpers';
import type { NPSApplication } from '../../containers/netPromoterScore/interface';
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

export const useScimGroupsOnboardingModal: () => StartupModal = () => {
    const [modal, setModal, renderModal] = useModalState();

    const showScimGroupsOnboardingModal = useShowScimGroupsOnboardingModal();

    return {
        showModal: showScimGroupsOnboardingModal,
        activateModal: () => setModal(true),
        component: renderModal ? <ScimGroupsOnboardingModal {...modal} /> : null,
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

export const useNetPromoterScoreModal = (application: NPSApplication): StartupModal => {
    const [modal, setModal, renderModal] = useModalState();
    const showModal = useNPSEligiblity(application);
    const featureCode = getFeatureCode(application);
    const { update } = useFeature(featureCode);
    const appName = npsConfig[application];

    return {
        showModal,
        activateModal: () => setModal(true),
        component: renderModal ? (
            <NetPromoterScoreModal config={appName} updateFeatureValue={update} {...modal} />
        ) : null,
    };
};
