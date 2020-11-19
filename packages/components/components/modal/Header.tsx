import React from 'react';
import { c } from 'ttag';
import Icon from '../icon/Icon';
import { classnames } from '../../helpers';
import Title from './Title';

interface Props extends Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>, 'children'> {
    modalTitleID: string;
    children: React.ReactNode;
    onClose?: () => void;
    displayTitle?: boolean;
    hasClose?: boolean;
    closeTextVisible?: boolean;
    closeTextModal?: string;
}

const Header = ({
    children,
    modalTitleID,
    className,
    closeTextModal,
    closeTextVisible,
    hasClose = true,
    displayTitle = true,
    onClose,
    ...rest
}: Props) => {
    const closeText = !closeTextModal ? c('Action').t`Close modal` : closeTextModal;
    return (
        <header
            className={classnames(['pm-modalHeader', !displayTitle && 'pm-modalHeader--no-title', className])}
            {...rest}
        >
            {hasClose ? (
                <button
                    type="button"
                    className="pm-modalClose"
                    title={closeText}
                    onClick={onClose}
                    data-focus-fallback="-3"
                >
                    <span className={classnames(['mr0-25', !closeTextVisible && 'sr-only'])}>{closeText}</span>
                    <Icon className="pm-modalClose-icon" name="close" />
                </button>
            ) : null}
            {typeof children === 'string' ? (
                <Title id={modalTitleID} className={!displayTitle ? 'sr-only' : undefined}>
                    {children}
                </Title>
            ) : (
                children
            )}
        </header>
    );
};

export default Header;
