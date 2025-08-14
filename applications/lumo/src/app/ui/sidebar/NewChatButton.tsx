import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import clsx from 'clsx';
import { c } from 'ttag';

import type { ButtonLikeProps } from '@proton/atoms';
import { Button, Tooltip } from '@proton/atoms';
import type { IconSize } from '@proton/components';
import { Icon } from '@proton/components';
import type { PopperPlacement } from '@proton/components';

import { useGuestChatHandler } from '../../hooks/useGuestChatHandler';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { GuestChatDisclaimerModal } from '../components/GuestChatDisclaimerModal';

interface Props {
    isCollapsed: boolean;
    isSmallScreen: boolean;
}

interface NewChatButtonProps {
    buttonProps: ButtonLikeProps<'button'>;
    children: React.ReactNode;
    toolTipPlacement?: PopperPlacement;
}

const NewChatButtonGuest = ({ buttonProps, children, toolTipPlacement }: NewChatButtonProps) => {
    const { handleGuestClick, handleDisclaimerClose, disclaimerModalProps } = useGuestChatHandler();
    const history = useHistory();
    const { setGhostChatMode } = useGhostChat();

    const handleButtonClick = useCallback(() => {
        setGhostChatMode(false);
        history.push('/');
    }, [setGhostChatMode, history]);

    const handleModalCloseClick = useCallback(() => {
        handleDisclaimerClose();
        handleButtonClick();
    }, [handleButtonClick, handleDisclaimerClose]);

    return (
        <>
            <Tooltip title={c('collider_2025: Action').t`New chat`} originalPlacement={toolTipPlacement}>
                <Button onClick={handleGuestClick} {...buttonProps}>
                    {children}
                </Button>
            </Tooltip>
            {disclaimerModalProps.render && (
                <GuestChatDisclaimerModal onClick={handleModalCloseClick} {...disclaimerModalProps.modalProps} />
            )}
        </>
    );
};

const NewChatButtonAuthenticated = ({ buttonProps, children, toolTipPlacement }: NewChatButtonProps) => {
    const history = useHistory();
    const { setGhostChatMode } = useGhostChat();

    const handleClick = useCallback(() => {
        setGhostChatMode(false);
        history.push('/');
    }, [setGhostChatMode, history]);

    return (
        <Tooltip title={c('collider_2025: Action').t`New chat`} originalPlacement={toolTipPlacement}>
            <Button onClick={handleClick} {...buttonProps}>
                {children}
            </Button>
        </Tooltip>
    );
};

const NewChatButton = ({ buttonProps, children, toolTipPlacement }: NewChatButtonProps) => {
    const isGuest = useIsGuest();

    return isGuest ? (
        <NewChatButtonGuest buttonProps={buttonProps} toolTipPlacement={toolTipPlacement}>
            {children}
        </NewChatButtonGuest>
    ) : (
        <NewChatButtonAuthenticated buttonProps={buttonProps} toolTipPlacement={toolTipPlacement}>
            {children}
        </NewChatButtonAuthenticated>
    );
};

const NewChatButtonSidebar = ({ isCollapsed, isSmallScreen }: Props) => {
    if (isSmallScreen) {
        return null;
    }

    const buttonClassName = clsx('w-full', isCollapsed && 'px-0 md:flex');

    return (
        <div className="px-3 py-2 shrink-0 md:block">
            <NewChatButton
                buttonProps={{
                    className: buttonClassName,
                    size: 'medium',
                    color: 'norm',
                    icon: true,
                }}
                toolTipPlacement="right"
            >
                {isCollapsed ? (
                    <Icon name="pen-square" className="flex mx-auto" alt={c('collider_2025:Button').t`New chat`} />
                ) : (
                    c('collider_2025:Button').t`New chat`
                )}
            </NewChatButton>
        </div>
    );
};

export default NewChatButtonSidebar;

export const NewChatButtonHeader = ({ iconSize = 5 }: { iconSize?: IconSize }) => {
    return (
        <NewChatButton
            buttonProps={{
                shape: 'ghost',
                size: 'medium',
                icon: true,
                className: 'shrink-0',
            }}
            toolTipPlacement="left"
        >
            <Icon name="pen-square" size={iconSize} alt={c('collider_2025: Link').t`New chat`} />
        </NewChatButton>
    );
};
