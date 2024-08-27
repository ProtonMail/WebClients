import type { PropsWithChildren, ReactNode } from 'react';

import type { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import clsx from '@proton/utils/clsx';

import './Modal.scss';

interface Props extends ModalOwnProps {
    title?: string;
    titleClassName?: string;
    header?: ReactNode;
    subline?: string | JSX.Element;
    className?: string;
    key?: React.Key;
    hasClose?: boolean;
}

export const Modal = ({
    header,
    title,
    titleClassName,
    subline,
    children,
    key,
    hasClose,
    ...rest
}: PropsWithChildren<Props>) => {
    return (
        <ModalTwo {...rest} key={key}>
            {header ?? (
                <ModalTwoHeader
                    title={title}
                    titleClassName={clsx('mx-auto text-center', titleClassName)}
                    subline={subline && <p className="text-center">{subline}</p>}
                    closeButtonProps={{ shape: 'solid', className: 'shrink-0 rounded-full bg-norm' }}
                    hasClose={hasClose}
                />
            )}

            <ModalTwoContent className="pb-6">{children}</ModalTwoContent>
        </ModalTwo>
    );
};
