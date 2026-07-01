import { altKey, isMac, metaKey, shiftKey } from '@proton/shared/lib/helpers/browser';
import { KeyboardKey } from '@proton/shared/lib/interfaces';

/**
 * Single source of truth for the camera/microphone toggle keyboard shortcuts.
 *
 * - Microphone: `Cmd + Shift + A` (macOS) / `Alt + A` (Windows/Linux)
 * - Camera: `Cmd + Shift + V` (macOS) / `Alt + V` (Windows/Linux)
 *
 * macOS relies on the `Cmd + Shift` modifier combination while other platforms use
 * `Alt`, so we branch on `isMac()` rather than relying on the `useHotkeys` Meta/Ctrl
 * normalization (which only swaps Meta for Control).
 */

export const MICROPHONE_SHORTCUT_KEY = KeyboardKey.A;
export const CAMERA_SHORTCUT_KEY = KeyboardKey.V;

const isMacOS = isMac();

const getShortcutLabel = (key: string) => (isMacOS ? `${metaKey} + ${shiftKey} + ${key}` : `${altKey} + ${key}`);

export const microphoneShortcutLabel = getShortcutLabel(MICROPHONE_SHORTCUT_KEY);
export const cameraShortcutLabel = getShortcutLabel(CAMERA_SHORTCUT_KEY);
