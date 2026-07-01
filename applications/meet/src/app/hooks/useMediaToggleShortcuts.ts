import { type DependencyList, useRef } from 'react';

import { type HotkeyTuple, useHotkeys } from '@proton/components';
import { isMac } from '@proton/shared/lib/helpers/browser';
import { KeyboardKey } from '@proton/shared/lib/interfaces';

import { CAMERA_SHORTCUT_KEY, MICROPHONE_SHORTCUT_KEY } from '../utils/mediaShortcuts';

interface UseMediaToggleShortcutsProps {
    onToggleMicrophone: () => void;
    onToggleCamera: () => void;
    dependencies?: DependencyList;
}

/**
 * Registers the microphone and camera keyboard shortcuts:
 * - Microphone: `Cmd + Shift + A` (macOS) / `Alt + A` (Windows/Linux)
 * - Camera: `Cmd + Shift + V` (macOS) / `Alt + V` (Windows/Linux)
 *
 * The modifier combination differs per platform (`Cmd + Shift` on macOS, `Alt`
 * elsewhere), so we branch on `isMac()` here rather than relying on the `useHotkeys`
 * Meta/Ctrl normalization.
 */
export const useMediaToggleShortcuts = ({
    onToggleMicrophone,
    onToggleCamera,
    dependencies = [],
}: UseMediaToggleShortcutsProps) => {
    const elementRef = useRef<Document>(document);

    const modifiers = isMac() ? [KeyboardKey.Meta, KeyboardKey.Shift] : [KeyboardKey.Alt];

    const shortcutHandlers: HotkeyTuple[] = [
        [
            [...modifiers, MICROPHONE_SHORTCUT_KEY],
            (e) => {
                e.preventDefault();
                onToggleMicrophone();
            },
        ],
        [
            [...modifiers, CAMERA_SHORTCUT_KEY],
            (e) => {
                e.preventDefault();
                onToggleCamera();
            },
        ],
    ];

    useHotkeys(elementRef, shortcutHandlers, { dependencies });
};
