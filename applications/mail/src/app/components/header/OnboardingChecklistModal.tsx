import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';

import UsersOnboardingChecklist from '../onboarding/checklist/UsersOnboardingChecklist';

const OnboardingChecklistModal = (rest: ModalProps) => {
    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader />
            <ModalTwoContent>
                <UsersOnboardingChecklist hideDismissButton />
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default OnboardingChecklistModal;
