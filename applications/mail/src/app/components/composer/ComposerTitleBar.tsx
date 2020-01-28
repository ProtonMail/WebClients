import React from 'react';
import { c } from 'ttag';
import { Icon, Button, classnames } from 'react-components';

import { MessageExtended } from '../../models/message';

interface ButtonProps {
    onClick: () => void;
    iconName: string;
    className?: string;
}

const TitleBarButton = ({ onClick, iconName, className = '' }: ButtonProps) => {
    return (
        <Button className={classnames(['composer-title-bar-button', className])} onClick={onClick}>
            <Icon className="mauto" name={iconName} color="currentColor" />
        </Button>
    );
};

interface Props {
    message: MessageExtended;
    minimized: boolean;
    maximized: boolean;
    toggleMinimized: () => void;
    toggleMaximized: () => void;
    onClose: () => void;
}

const ComposerTitleBar = ({ message = {}, minimized, maximized, toggleMinimized, toggleMaximized, onClose }: Props) => {
    const title = message.data?.Subject || c('Title').t`New message`;

    return (
        <header className="composer-title-bar flex flex-row">
            <span className="flex-self-vcenter flex-item-fluid pl0-5 pr1 ellipsis">{title}</span>
            <TitleBarButton
                iconName="minimize"
                className={classnames([minimized && 'rotateX-180'])}
                onClick={toggleMinimized}
            />
            <TitleBarButton iconName={maximized ? 'contract-window' : 'expand'} onClick={toggleMaximized} />
            <TitleBarButton iconName="close" onClick={onClose} />
        </header>
    );
};

export default ComposerTitleBar;
