import React from 'react';
import { c } from 'ttag';
import { Icon, Tooltip, classnames } from 'react-components';
import { MessageExtended } from '../../models/message';

interface ButtonProps {
    onClick: () => void;
    iconName: string;
    className?: string;
    title?: string;
    disabled?: boolean;
}

const TitleBarButton = ({ onClick, iconName, className = '', title, disabled = false }: ButtonProps) => {
    return (
        <Tooltip title={title} className="composer-title-bar-tooltip flex-item-noshrink flex">
            <button
                type="button"
                className={classnames(['composer-title-bar-button flex p0-5', className])}
                onClick={onClick}
                disabled={disabled}
            >
                <Icon className="mauto" name={iconName} />
                <span className="sr-only">{title}</span>
            </button>
        </Tooltip>
    );
};

interface Props {
    message: MessageExtended;
    closing: boolean;
    minimized: boolean;
    maximized: boolean;
    toggleMinimized: () => void;
    toggleMaximized: () => void;
    onClose: () => void;
}

const ComposerTitleBar = ({
    message,
    closing,
    minimized,
    maximized,
    toggleMinimized,
    toggleMaximized,
    onClose,
}: Props) => {
    const title = message.data?.Subject || c('Title').t`New message`;

    const handleDoubleClick = () => {
        if (minimized) {
            toggleMinimized();
            return;
        }
        toggleMaximized();
    };

    return (
        <header
            className="composer-title-bar flex flex-row flex-items-center flex-nowrap pl0-5 pr0-5 w100 color-global-light"
            onDoubleClick={handleDoubleClick}
        >
            <span className="flex-item-fluid p0-5 pr1 ellipsis">{title}</span>
            <TitleBarButton
                iconName="minimize"
                className={classnames(['nomobile', minimized && 'rotateX-180'])}
                title={minimized ? c('Action').t`Maximize composer` : c('Action').t`Minimize composer`}
                onClick={toggleMinimized}
            />
            <TitleBarButton
                iconName={maximized ? 'contract-window' : 'expand'}
                title={maximized ? c('Action').t`Contract composer` : c('Action').t`Expand composer`}
                className="nomobile"
                onClick={toggleMaximized}
            />
            <TitleBarButton
                iconName="close"
                title={c('Action').t`Close composer`}
                onClick={onClose}
                disabled={closing}
            />
        </header>
    );
};

export default ComposerTitleBar;
