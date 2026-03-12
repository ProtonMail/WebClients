import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { metaKey } from '@proton/shared/lib/helpers/browser';

import { GuestChatDisclaimerModal } from '../../../components/Modals/GuestChatDisclaimerModal';
import { useGuestChatHandler } from '../../../hooks/useGuestChatHandler';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { setNativeGhostMode } from '../../../remote/nativeComposerBridgeHelpers';
import { SidebarItem } from './SidebarItem';

interface Props {
    showText: boolean;
    isSmallScreen: boolean;
}

export const NewChatSidebarButton = ({ showText, isSmallScreen }: Props) => {
    const isGuest = useIsGuest();
    const history = useHistory();
    const { setGhostChatMode } = useGhostChat();
    const { handleGuestClick, handleDisclaimerClose, disclaimerModalProps } = useGuestChatHandler();

    const handleNewChat = useCallback(() => {
        setGhostChatMode(false);
        setNativeGhostMode(false);
        history.push('/');
    }, [setGhostChatMode, history]);

    const handleModalClose = useCallback(() => {
        handleDisclaimerClose();
        handleNewChat();
    }, [handleNewChat, handleDisclaimerClose]);

    return (
        <>
            <SidebarItem
                icon="pen-square"
                label={c('collider_2025:Button').t`New chat`}
                onClick={isGuest ? handleGuestClick : handleNewChat}
                showText={showText}
                shortcut={!isSmallScreen ? `${metaKey}+J` : undefined}
                showShortcutOnHover={true}
            />
            {isGuest && disclaimerModalProps.render && (
                <GuestChatDisclaimerModal onClick={handleModalClose} {...disclaimerModalProps.modalProps} />
            )}
        </>
    );
};
