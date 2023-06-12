import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import ModalCloseButton from './ModalCloseButton';
import Title from './Title';

interface Props extends Omit<DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>, 'children'> {
    modalTitleID?: string;
    children?: ReactNode;
    onClose?: () => void;
    displayTitle?: boolean;
    hasClose?: boolean;
    closeTextModal?: string;
    noEllipsis?: boolean;
}

/**
 * @deprecated Please use ModalTwo instead
 */
const Header = ({
    children,
    modalTitleID = 'modalTitle',
    className,
    closeTextModal,
    hasClose = true,
    displayTitle = true,
    onClose,
    noEllipsis = false,
    ...rest
}: Props) => {
    return (
        <header className={clsx(['modal-header', !displayTitle && 'modal-header--no-title', className])} {...rest}>
            {hasClose ? <ModalCloseButton closeTextModal={closeTextModal} onClose={onClose} /> : null}
            {typeof children === 'string' ? (
                <Title
                    id={modalTitleID}
                    className={!displayTitle ? 'sr-only' : noEllipsis ? undefined : 'text-ellipsis'}
                >
                    {children}
                </Title>
            ) : (
                children
            )}
        </header>
    );
};

export default Header;
