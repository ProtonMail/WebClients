import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Icon } from '@proton/components';
import Toggle from '@proton/components/components/toggle/Toggle';
import { metaKey } from '@proton/shared/lib/helpers/browser';

import { GuestChatDisclaimerModal } from '../../../components/Guest/GuestChatDisclaimerModal';
import { useGuestChatHandler } from '../../../hooks/useGuestChatHandler';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useSidebar } from '../../../providers/SidebarProvider';
import { setNativeGhostMode } from '../../../remote/nativeComposerBridgeHelpers';

export const NewChatSidebarButton = () => {
    const isGuest = useIsGuest();
    const history = useHistory();
    const { isSmallScreen } = useSidebar();
    const { isGhostChatMode, setGhostChatMode } = useGhostChat();
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

    const handleGhostToggle = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setGhostChatMode(e.target.checked);
        },
        [setGhostChatMode]
    );

    return (
        <>
            <div className="sidebar-item flex items-center w-full cursor-pointer py-2 px-1.5 show-shortcut-on-hover">
                <button
                    className="sidebar-item-main-action flex-1 flex items-center h-full p-0 cursor-pointer"
                    onClick={isGuest ? handleGuestClick : handleNewChat}
                    aria-label={c('collider_2025:Button').t`New chat`}
                >
                    <div className="sidebar-item-icon flex items-center justify-center shrink-0 mr-1.5">
                        <Icon name="pen-square" size={4} className="rtl:mirror" />
                    </div>
                    <span className="sidebar-item-text flex-1 flex items-center justify-space-between text-nowrap overflow-hidden gap-2">
                        <span className="sidebar-item-label">{c('collider_2025:Button').t`New chat`}</span>
                        {!isSmallScreen && (
                            <span className="sidebar-item-shortcut shrink-0 ml-auto">
                                <Kbd shortcut={`${metaKey}+J`} />
                            </span>
                        )}
                    </span>
                </button>
                <Toggle
                    id="ghost-chat-toggle"
                    checked={isGhostChatMode}
                    onChange={handleGhostToggle}
                    title={c('collider_2025:Toggle').t`Ghost chat mode`}
                />
            </div>
            {isGuest && disclaimerModalProps.render && (
                <GuestChatDisclaimerModal onClick={handleModalClose} {...disclaimerModalProps.modalProps} />
            )}
        </>
    );
};
