import { useState } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../components/sections/ContextMenu';

interface BaseProps {
    onClick: () => void | Promise<void>;
}

interface ContextMenuProps extends BaseProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarProps extends BaseProps {
    buttonType: 'toolbar';
    close?: never;
}

type Props = ContextMenuProps | ToolbarProps;

export const CopyLinkButton = ({ buttonType, onClick, close }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const title = c('Action').t`Copy link`;

    const handleClick = async () => {
        setIsLoading(true);
        try {
            await onClick();
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
        } finally {
            setIsLoading(false);
        }
    };

    const iconName = showSuccess ? 'checkmark' : 'link';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={iconName} alt={title} />}
                onClick={handleClick}
                disabled={isLoading}
                data-testid="toolbar-copy-link"
                loading={isLoading}
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={iconName}
                testId="context-menu-copy-link"
                action={handleClick}
                close={close}
                loading={isLoading}
            />
        );
    }
};
