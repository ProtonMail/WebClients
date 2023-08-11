import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';

import UsersOnboardingChecklist from '../checklist/UsersOnboardingChecklist';

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
