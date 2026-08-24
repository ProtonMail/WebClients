import { useSubscription } from '@proton/account/subscription/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { FeatureCode, useFeature } from '@proton/features';

import NetPromoterScoreModal from '../../containers/netPromoterScore/NetPromoterScoreModal';
import { npsConfig } from '../../containers/netPromoterScore/config';
import { getFeatureCode } from '../../containers/netPromoterScore/helpers';
import { useNPSEligiblity } from '../../containers/netPromoterScore/hooks/useNPSEligibility';
import type { NPSApplication } from '../../containers/netPromoterScore/interface';
import ScimGroupsOnboardingModal from '../../containers/organization/ScimGroupsOnboardingModal';
import LightLabellingFeatureModal from '../../containers/organization/logoUpload/LightLabellingFeatureModal';
import { useShowLightLabellingFeatureModal } from '../../containers/organization/logoUpload/useShowLightLabellingFeatureModal';
import { useShowScimGroupsOnboardingModal } from '../../containers/organization/useShowScimGroupsOnboardingModal';
import CancellationReminderModal from '../../containers/payments/subscription/cancellationReminder/CancellationReminderModal';
import type { ReminderFlag } from '../../containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import { shouldOpenReminderModal } from '../../containers/payments/subscription/cancellationReminder/cancellationReminderHelper';
import TrialEndedModal from '../../containers/subscription/TrialEndedModal';
import useModalState from '../modalTwo/useModalState';
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
