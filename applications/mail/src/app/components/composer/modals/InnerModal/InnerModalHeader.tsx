import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';

import { classnames } from '@proton/components';

import InnerModalModalCloseButton from './InnerModalCloseButton';
import InnerModalTitle from './InnerModalTitle';

interface Props extends Omit<DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>, 'children'> {
    modalTitleID?: string;
    children?: ReactNode;
    onClose?: () => void;
    displayTitle?: boolean;
    hasClose?: boolean;
    closeTextModal?: string;
    noEllipsis?: boolean;
}

const InnerModalHeader = ({
    children,
    modalTitleID = 'modalTitle',
    className,
    closeTextModal,
    hasClose = true,
    onClose,
    noEllipsis = false,
    ...rest
}: Props) => {
    return (
        <header className={classnames(['inner-modal-header', className])} {...rest}>
            {hasClose ? <InnerModalModalCloseButton closeTextModal={closeTextModal} onClose={onClose} /> : null}
            {typeof children === 'string' ? (
                <InnerModalTitle id={modalTitleID} className={noEllipsis ? undefined : 'text-ellipsis'}>
                    {children}
                </InnerModalTitle>
            ) : (
                children
            )}
        </header>
    );
};

export default InnerModalHeader;
