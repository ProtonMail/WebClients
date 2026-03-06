import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import { useIsGuest } from '../../../providers/IsGuestProvider';
import OnboardingModal from '../../Onboarding/OnboardingModal';
import OnboardingPill from '../../Onboarding/OnboardingPill';
import { MainContainerBottomLinks } from './MainContainerBottomLinks';
import TermsAndConditions from './TermsAndConditions';

const MainContainerFooter = () => {
    const onboardingModal = useModalStateObject();
    const isGuest = useIsGuest();

    const handleOpenModal = () => {
        onboardingModal.openModal(true);
    };

    return (
        <>
            <div className="flex flex-row flex-nowrap justify-space-between p-2 items-center hidden md:flex">
                <MainContainerBottomLinks className="hidden lg:flex" />
                {isGuest && <TermsAndConditions className="mx-auto lg:mx-0" />}
                <OnboardingPill className="hidden lg:flex" onClick={handleOpenModal} />
            </div>
            {onboardingModal.render && <OnboardingModal {...onboardingModal.modalProps} />}
        </>
    );
};

export default MainContainerFooter;
