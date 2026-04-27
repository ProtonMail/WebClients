import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import OnboardingModal from '../../Onboarding/OnboardingModal';
import OnboardingPill from '../../Onboarding/OnboardingPill';
import { MainContainerBottomLinks } from './MainContainerBottomLinks';

const MainContainerFooter = () => {
    const onboardingModal = useModalStateObject();

    const handleOpenModal = () => {
        onboardingModal.openModal(true);
    };

    return (
        <>
            <div className="flex flex-row flex-nowrap justify-space-between p-2 items-center hidden md:flex">
                <MainContainerBottomLinks className="hidden md:flex" />
                <OnboardingPill className="hidden md:flex" onClick={handleOpenModal} />
            </div>
            {onboardingModal.render && <OnboardingModal {...onboardingModal.modalProps} />}
        </>
    );
};

export default MainContainerFooter;
