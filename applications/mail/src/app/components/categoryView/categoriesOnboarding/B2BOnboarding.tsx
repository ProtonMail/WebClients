import { useModalState } from '@proton/components';

import { B2BOnboardingModal } from './B2BOnboardingModal';

export const B2BOnboarding = () => {
    const [modalProps, , renderModal] = useModalState({ open: true });
    return renderModal ? <B2BOnboardingModal {...modalProps} /> : null;
};
