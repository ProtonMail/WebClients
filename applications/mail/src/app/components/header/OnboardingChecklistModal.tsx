import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';

import OnboardingChecklistWrapper from '../checklist/OnboardingChecklistWrapper';

const OnboardingChecklistModal = (rest: ModalProps) => {
    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader />
            <ModalTwoContent>
                <OnboardingChecklistWrapper hideDismissButton />
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default OnboardingChecklistModal;
