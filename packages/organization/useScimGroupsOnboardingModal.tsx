import useModalState from '@proton/components/components/modalTwo/useModalState';
import type { StartupModal } from '@proton/components/components/startupModals/types';

import ScimGroupsOnboardingModal from './ScimGroupsOnboardingModal';
import { useShowScimGroupsOnboardingModal } from './useShowScimGroupsOnboardingModal';

export const useScimGroupsOnboardingModal: () => StartupModal = () => {
    const [modal, setModal, renderModal] = useModalState();

    const showScimGroupsOnboardingModal = useShowScimGroupsOnboardingModal();

    return {
        showModal: showScimGroupsOnboardingModal,
        activateModal: () => setModal(true),
        component: renderModal ? <ScimGroupsOnboardingModal {...modal} /> : null,
    };
};
