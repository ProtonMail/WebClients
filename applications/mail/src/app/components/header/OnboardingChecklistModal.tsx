import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';

import OldOnboardingChecklistPlaceholder from '../onboarding/checklist/messageListPlaceholder/variants/old/OldOnboardingChecklistPlaceholder';

const OnboardingChecklistModal = (rest: ModalProps) => {
    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader />
            <ModalTwoContent>
                <OldOnboardingChecklistPlaceholder hideDismissButton />
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default OnboardingChecklistModal;
