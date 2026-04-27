import { useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { type HotkeyTuple, useHotkeys } from '@proton/components';
import { KeyboardKey } from '@proton/shared/lib/interfaces';

import { useGhostChat } from '../providers/GhostChatProvider';
import { useIsGuest } from '../providers/IsGuestProvider';
import { setNativeGhostMode } from '../remote/nativeComposerBridgeHelpers';
import { useGuestChatHandler } from './useGuestChatHandler';

interface UseKeyboardShortcutsProps {
    onOpenSearch: () => void;
}

export const useKeyboardShortcuts = ({ onOpenSearch }: UseKeyboardShortcutsProps) => {
    const history = useHistory();
    const isGuest = useIsGuest();
    const { setGhostChatMode } = useGhostChat();
    const { handleGuestClick } = useGuestChatHandler();
    const elementRef = useRef<Document>(document);

    const handleNewChat = useCallback(() => {
        if (isGuest) {
            handleGuestClick();
        } else {
            setGhostChatMode(false);
            setNativeGhostMode(false);
            history.push('/');
        }
    }, [isGuest, handleGuestClick, setGhostChatMode, history]);

    const shortcutHandlers: HotkeyTuple[] = [
        // Cmd/Ctrl+J: New chat (normalizeMetaControl handles Mac/PC conversion)
        [
            [KeyboardKey.Meta, KeyboardKey.J],
            (e) => {
                e.preventDefault();
                handleNewChat();
            },
        ],
        // Cmd/Ctrl+K: Open search (normalizeMetaControl handles Mac/PC conversion)
        [
            [KeyboardKey.Meta, KeyboardKey.K],
            (e) => {
                e.preventDefault();
                onOpenSearch();
            },
        ],
    ];

    useHotkeys(elementRef, shortcutHandlers, { dependencies: [handleNewChat, onOpenSearch] });
};
