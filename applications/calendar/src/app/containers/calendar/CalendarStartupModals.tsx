import {
    type StartupModal,
    StartupModals,
    useCancellationReminderModal,
    useLightLabellingFeatureModal,
    useReferralModal,
    useTrialEndedModal,
} from '@proton/components';

const useStartupModals: () => StartupModal[] = () => {
    const trialEndedModal = useTrialEndedModal();
    const reminderModal = useCancellationReminderModal();
    const referralModal = useReferralModal();
    const lightLabellingFeatureModal = useLightLabellingFeatureModal();

    return [trialEndedModal, referralModal, reminderModal, lightLabellingFeatureModal];
};

const CalendarStartupModals = ({ setModalOpen }: { setModalOpen: (state: boolean) => void }) => {
    const modals = useStartupModals();
    return <StartupModals modals={modals} setModalOpen={setModalOpen} />;
};

export default CalendarStartupModals;
