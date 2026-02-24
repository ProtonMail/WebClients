import { useModalStateObject } from '@proton/components';

import { useOnboardingContext } from '../../providers/OnboardingProvider';
import OnboardingModal from './OnboardingModal';
import OnboardingPill from './OnboardingPill';
import OnboardingSection from './OnboardingSection';

const LumoOnboarding = () => {
    const { isOnboardingCompleted, completeOnboarding } = useOnboardingContext();

    const onboardingModal = useModalStateObject({
        onClose: () => {
            completeOnboarding();
        },
    });

    const handleOpenModal = () => {
        onboardingModal.openModal(true);
    };

    if (isOnboardingCompleted === undefined) {
        return null;
    }

    return (
        <>
            {!isOnboardingCompleted ? (
                <OnboardingSection onClick={handleOpenModal} onClose={completeOnboarding} />
            ) : (
                <OnboardingPill onClick={handleOpenModal} />
            )}
            {onboardingModal.render && <OnboardingModal {...onboardingModal.modalProps} />}
        </>
    );
};

export default LumoOnboarding;
