import { ElementType, ReactNode } from 'react';

import {
    ModalOwnProps as MainModalOwnProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useModalState,
} from '../';
import { PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';

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
