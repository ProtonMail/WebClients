import { useCallback } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import type { PopperPlacement } from '@proton/atoms/Popper/interface';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { useGuestChatHandler } from '../../hooks/useGuestChatHandler';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversationById, selectSpaceById } from '../../redux/selectors';
import { getProjectInfo } from '../../types';
import { GuestChatDisclaimerModal } from '../Guest/GuestChatDisclaimerModal';
import { LumoIcon } from '../LumoIcon/LumoIcon';

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
                <Button className="testing" onClick={handleGuestClick} {...buttonProps}>
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
    const conversationRouteMatch = useRouteMatch<{ conversationId: string }>('/c/:conversationId');
    const conversationId = conversationRouteMatch?.params.conversationId;

    const conversation = useLumoSelector(selectConversationById(conversationId ?? ''));
    const space = useLumoSelector(selectSpaceById(conversation?.spaceId ?? ''));
    const { project } = getProjectInfo(space);

    const handleClick = useCallback(() => {
        setGhostChatMode(false);
        if (project && conversation?.spaceId) {
            history.push(`/projects/${conversation.spaceId}`);
        } else {
            history.push('/');
        }
    }, [setGhostChatMode, history, project, conversation?.spaceId]);

    return (
        <Tooltip title={c('collider_2025: Action').t`New chat`} originalPlacement={toolTipPlacement}>
            <Button onClick={handleClick} {...buttonProps}>
                {children}
            </Button>
        </Tooltip>
    );
};

export const NewChatButton = ({ buttonProps, children, toolTipPlacement }: NewChatButtonProps) => {
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

export const NewChatButtonHeader = () => {
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
            <LumoIcon name="SquarePen" size={20} aria-label={c('collider_2025: Link').t`New chat`} />
        </NewChatButton>
    );
};
