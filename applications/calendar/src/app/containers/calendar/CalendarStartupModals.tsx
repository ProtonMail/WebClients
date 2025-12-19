import {
    type StartupModal,
    StartupModals,
    useCancellationReminderModal,
    useLightLabellingFeatureModal,
    useTrialEndedModal,
} from '@proton/components';
import { useNetPromoterScoreModal } from '@proton/components/components/startupModals/startupModalHooks';
import { NPSApplication } from '@proton/components/containers/netPromoterScore/interface';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

const useStartupModals: () => StartupModal[] = () => {
    const trialEndedModal = useTrialEndedModal();
    const reminderModal = useCancellationReminderModal();
    const lightLabellingFeatureModal = useLightLabellingFeatureModal();
    const netPromoterScoreModal = useNetPromoterScoreModal(
        isElectronMail ? NPSApplication.DesktopCalendar : NPSApplication.WebCalendar
    );

    return [trialEndedModal, reminderModal, lightLabellingFeatureModal, netPromoterScoreModal];
};

const CalendarStartupModals = ({ setModalOpen }: { setModalOpen: (state: boolean) => void }) => {
    const modals = useStartupModals();
    return <StartupModals modals={modals} setModalOpen={setModalOpen} />;
};

export default CalendarStartupModals;
