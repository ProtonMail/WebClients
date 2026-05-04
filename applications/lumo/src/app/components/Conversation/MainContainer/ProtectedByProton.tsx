import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import OnboardingModal from '../../Onboarding/OnboardingModal';
import OnboardingPill from '../../Onboarding/OnboardingPill';

const MainContainerFooter = () => {
    const onboardingModal = useModalStateObject();

    const handleOpenModal = () => {
        onboardingModal.openModal(true);
    };

    return (
        <>
            <OnboardingPill onClick={handleOpenModal} />
            {onboardingModal.render && <OnboardingModal {...onboardingModal.modalProps} />}
        </>
    );
};

export default MainContainerFooter;
