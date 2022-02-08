import { ElementType, ReactNode } from 'react';

import { PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';
import {
    ModalTwo,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
    ModalOwnProps as MainModalOwnProps,
    useModalState,
} from '../';

interface ModalOwnProps extends MainModalOwnProps {
    title?: string;
    children: ReactNode;
    footer: ReactNode;
    isOpen: boolean;
}

const BasicModal = ({
    title,
    children,
    footer,
    isOpen,
    onClose,
    onExit,
    ...rest
}: PolymorphicComponentProps<ElementType, ModalOwnProps>) => {
    const [modalProps] = useModalState({ open: isOpen, onClose, onExit });

    return (
        <ModalTwo {...rest} {...modalProps}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>{children}</ModalTwoContent>
            {footer && <ModalTwoFooter>{footer}</ModalTwoFooter>}
        </ModalTwo>
    );
};

export default BasicModal;
