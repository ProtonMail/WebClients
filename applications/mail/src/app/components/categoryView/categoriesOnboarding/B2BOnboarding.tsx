import { useModalState } from '@proton/components';

import { B2BOnboardingModal } from './B2BOnboardingModal';

interface Props {
    flagValue: number;
}

export const B2BOnboarding = ({ flagValue }: Props) => {
    const [modalProps, , renderModal] = useModalState({ open: true });
    return renderModal ? <B2BOnboardingModal {...modalProps} flagValue={flagValue} /> : null;
};
