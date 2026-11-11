import { useUserSettings } from '@proton/account/userSettings/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import type { StartupModal } from '@proton/components/components/startupModals/types';

import TrialEndedModal from './TrialEndedModal';

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
