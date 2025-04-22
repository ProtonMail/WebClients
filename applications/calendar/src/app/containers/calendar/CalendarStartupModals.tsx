import {
    type StartupModal,
    StartupModals,
    useCancellationReminderModal,
    useLightLabellingFeatureModal,
    useReferralModal,
} from '@proton/components';

const useStartupModals: () => StartupModal[] = () => {
    const reminderModal = useCancellationReminderModal();
    const referralModal = useReferralModal();
    const lightLabellingFeatureModal = useLightLabellingFeatureModal();

    return [referralModal, reminderModal, lightLabellingFeatureModal];
};

const CalendarStartupModals = ({ setModalOpen }: { setModalOpen: (state: boolean) => void }) => {
    const modals = useStartupModals();
    return <StartupModals modals={modals} setModalOpen={setModalOpen} />;
};

export default CalendarStartupModals;
