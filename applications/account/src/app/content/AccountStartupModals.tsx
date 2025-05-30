import { StartupModals, useLightLabellingFeatureModal, useTrialEndedModal } from '@proton/components';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

const useStartupModals = () => {
    const trialEndedModal = useTrialEndedModal();
    const lightLabellingFeatureModal = useLightLabellingFeatureModal();
    return [trialEndedModal, lightLabellingFeatureModal];
};

const AccountStartupModals = () => {
    const modals = useStartupModals();

    if (isElectronMail) {
        return null;
    }

    return <StartupModals modals={modals} />;
};

export default AccountStartupModals;
