import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';

import { classnames } from '../../helpers';
import Title from './Title';
import ModalCloseButton from './ModalCloseButton';

interface Props extends Omit<DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>, 'children'> {
    modalTitleID?: string;
    children?: ReactNode;
    onClose?: () => void;
    displayTitle?: boolean;
    hasClose?: boolean;
    closeTextModal?: string;
    noEllipsis?: boolean;
}

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
        <header
            className={classnames(['modal-header', !displayTitle && 'modal-header--no-title', className])}
            {...rest}
        >
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
