import { StartupModals, useLightLabellingFeatureModal } from '@proton/components';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

const useStartupModals = () => {
    const lightLabellingFeatureModal = useLightLabellingFeatureModal();
    return [lightLabellingFeatureModal];
};

const AccountStartupModals = () => {
    const modals = useStartupModals();

    if (isElectronMail) {
        return null;
    }

    return <StartupModals modals={modals} />;
};

export default AccountStartupModals;
