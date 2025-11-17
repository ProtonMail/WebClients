import { useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { useHotkeys, type HotkeyTuple } from '@proton/components';
import { KeyboardKey } from '@proton/shared/lib/interfaces';

import { useIsGuest } from '../providers/IsGuestProvider';
import { useGhostChat } from '../providers/GhostChatProvider';
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

