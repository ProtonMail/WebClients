import * as React from 'react';
import { c } from 'ttag';
import { classnames } from '../../helpers';
import Title from './Title';
import { Button } from '../button';
import Icon from '../icon/Icon';

interface Props extends Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>, 'children'> {
    modalTitleID: string;
    children: React.ReactNode;
    onClose?: () => void;
    displayTitle?: boolean;
    hasClose?: boolean;
    closeTextModal?: string;
    noEllipsis?: boolean;
}

const Header = ({
    children,
    modalTitleID,
    className,
    closeTextModal,
    hasClose = true,
    displayTitle = true,
    onClose,
    noEllipsis = false,
    ...rest
}: Props) => {
    const closeText = !closeTextModal ? c('Action').t`Close modal` : closeTextModal;
    return (
        <header
            className={classnames(['modal-header', !displayTitle && 'modal-header--no-title', className])}
            {...rest}
        >
            {hasClose ? (
                <Button icon shape="ghost" size="small" className="modal-close" title={closeText} onClick={onClose}>
                    <Icon className="modal-close-icon" name="xmark" alt={closeText} />
                </Button>
            ) : null}
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
