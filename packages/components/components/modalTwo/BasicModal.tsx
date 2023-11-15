import { ElementType, ReactNode } from 'react';
import { PolymorphicPropsWithoutRef } from 'react-polymorphic-types';

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
    titleClassName?: string;
}

const BasicModal = <E extends ElementType>({
    title,
    children,
    footer,
    isOpen,
    onClose,
    onExit,
    hasClose,
    subline,
    titleClassName,
    ...rest
}: PolymorphicPropsWithoutRef<BasicModalProps, E>) => {
    const [modalProps] = useModalState({ open: isOpen, onClose, onExit });

    return (
        <ModalTwo {...rest} {...modalProps}>
            <ModalTwoHeader titleClassName={titleClassName} title={title} subline={subline} hasClose={hasClose} />
            <ModalTwoContent>{children}</ModalTwoContent>
            {footer && <ModalTwoFooter>{footer}</ModalTwoFooter>}
        </ModalTwo>
    );
};

export default BasicModal;
