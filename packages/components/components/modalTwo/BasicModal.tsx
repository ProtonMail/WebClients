import { ElementType, ReactNode } from 'react';

import { PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';
import ModalTwo, { ModalOwnProps as MainModalOwnProps } from './Modal';
import ModalTwoContent from './ModalContent';
import ModalTwoFooter from './ModalFooter';
import ModalTwoHeader from './ModalHeader';
import useModalState from './useModalState';

export interface BasicModalProps extends MainModalOwnProps {
    title?: string;
    children: ReactNode;
    footer: ReactNode;
    isOpen: boolean;
    hasClose?: boolean;
    subline?: string;
}

const BasicModal = ({
    title,
    children,
    footer,
    isOpen,
    onClose,
    onExit,
    hasClose,
    subline,
    ...rest
}: PolymorphicComponentProps<ElementType, BasicModalProps>) => {
    const [modalProps] = useModalState({ open: isOpen, onClose, onExit });

    return (
        <ModalTwo {...rest} {...modalProps}>
            <ModalTwoHeader title={title} subline={subline} hasClose={hasClose} />
            <ModalTwoContent>{children}</ModalTwoContent>
            {footer && <ModalTwoFooter>{footer}</ModalTwoFooter>}
        </ModalTwo>
    );
};

export default BasicModal;
