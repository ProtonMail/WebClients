import {
    type StartupModal,
    StartupModals,
    useCancellationReminderModal,
    useLightLabellingFeatureModal,
    useTrialEndedModal,
} from '@proton/components';

const useStartupModals: () => StartupModal[] = () => {
    const trialEndedModal = useTrialEndedModal();
    const reminderModal = useCancellationReminderModal();
    const lightLabellingFeatureModal = useLightLabellingFeatureModal();

    return [trialEndedModal, reminderModal, lightLabellingFeatureModal];
};

const CalendarStartupModals = ({ setModalOpen }: { setModalOpen: (state: boolean) => void }) => {
    const modals = useStartupModals();
    return <StartupModals modals={modals} setModalOpen={setModalOpen} />;
};

export default CalendarStartupModals;
