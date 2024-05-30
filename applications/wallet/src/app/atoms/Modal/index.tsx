import { PropsWithChildren } from 'react';

import ModalTwo, { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import './Modal.scss';

interface Props extends ModalOwnProps {
    title?: string;
    subline?: string;
    className?: string;
    key?: string;
    hasClose?: boolean;
}

export const Modal = ({ title, subline, children, key, hasClose, ...rest }: PropsWithChildren<Props>) => {
    return (
        <ModalTwo {...rest} key={key}>
            <ModalTwoHeader
                title={title}
                titleClassName="text-4xl mx-auto text-center"
                subline={subline && <p className="text-center mx-12">{subline}</p>}
                closeButtonProps={{ shape: 'solid', className: 'shrink-0 rounded-full bg-norm' }}
                hasClose={hasClose}
            />
            <ModalTwoContent className="pb-6">{children}</ModalTwoContent>
        </ModalTwo>
    );
};
