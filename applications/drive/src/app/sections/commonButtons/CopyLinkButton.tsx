import { useState } from 'react';

import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcLink } from '@proton/icons/icons/IcLink';

import { ContextMenuButton } from '../../statelessComponents/ContextMenu';

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

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={showSuccess ? <IcCheckmark alt={title} /> : <IcLink alt={title} />}
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
                icon={showSuccess ? <IcCheckmark /> : <IcLink />}
                testId="context-menu-copy-link"
                action={handleClick}
                close={close}
                loading={isLoading}
            />
        );
    }
};
