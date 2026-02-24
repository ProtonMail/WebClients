import { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon, type PopperPlacement } from '@proton/components';
import type { IconSize } from '@proton/icons/types';

import { useGuestChatHandler } from '../../hooks/useGuestChatHandler';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { GuestChatDisclaimerModal } from '../../components/Modals/GuestChatDisclaimerModal';

// Hook to manage delayed text rendering for smooth animations
const useDelayedTextVisibility = (isCollapsed: boolean) => {
    const [shouldShowText, setShouldShowText] = useState(!isCollapsed);

    useEffect(() => {
        if (isCollapsed) {
            // Immediately hide text when collapsing
            setShouldShowText(false);
        } else {
            // Delay showing text to allow animation to complete
            const timer = setTimeout(() => {
                setShouldShowText(true);
            }, 320); // Match the sidebar animation timing
            return () => clearTimeout(timer);
        }
    }, [isCollapsed]);

    return shouldShowText;
};

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
    const shouldShowText = useDelayedTextVisibility(isCollapsed);

    if (isSmallScreen) {
        return null;
    }

    const buttonClassName = clsx(
        'w-full flex items-center',
        isCollapsed ? 'justify-center px-0' : 'justify-start px-3'
    );

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
                <div className="flex items-center gap-2">
                    <Icon
                        name="pen-square"
                        className={clsx('shrink-0', isCollapsed && 'mx-auto')}
                        alt={c('collider_2025:Button').t`New chat`}
                    />
                    {shouldShowText && <span className="text-ellipsis">{c('collider_2025:Button').t`New chat`}</span>}
                </div>
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
