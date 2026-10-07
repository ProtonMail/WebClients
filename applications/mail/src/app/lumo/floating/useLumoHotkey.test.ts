import { fireEvent, renderHook } from '@testing-library/react';

import { focusLumoPrompt } from '@proton/llm/lib/lumoAgent/ui/focusLumoPrompt';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { useLumoHotkey } from './useLumoHotkey';

jest.mock('@proton/llm/lib/lumoAgent/ui/focusLumoPrompt', () => ({ focusLumoPrompt: jest.fn() }));
jest.mock('@proton/mail/store/mailSettings/hooks', () => ({ useMailSettings: jest.fn() }));

const openLumo = jest.fn();

const setShortcuts = (Shortcuts: number) => {
    jest.mocked(useMailSettings).mockReturnValue([{ Shortcuts }] as unknown as ReturnType<typeof useMailSettings>);
};

const pressShiftL = (target: Element = document.body) => {
    fireEvent.keyDown(target, { key: 'L', shiftKey: true });
};

beforeEach(() => {
    jest.clearAllMocks();
    setShortcuts(1);
});

describe('useLumoHotkey', () => {
    it('opens Lumo when it is closed', () => {
        renderHook(() => useLumoHotkey({ isCurrentSurfaceOpen: false, openLumo }));

        pressShiftL();

        expect(openLumo).toHaveBeenCalledTimes(1);
        expect(focusLumoPrompt).not.toHaveBeenCalled();
    });

    it('focuses the prompt when Lumo is already open', () => {
        renderHook(() => useLumoHotkey({ isCurrentSurfaceOpen: true, openLumo }));

        pressShiftL();

        expect(focusLumoPrompt).toHaveBeenCalledTimes(1);
        expect(openLumo).not.toHaveBeenCalled();
    });

    it('does nothing when keyboard shortcuts are off', () => {
        setShortcuts(0);
        renderHook(() => useLumoHotkey({ isCurrentSurfaceOpen: false, openLumo }));

        pressShiftL();

        expect(openLumo).not.toHaveBeenCalled();
    });

    it('does nothing while the user is typing in a field', () => {
        renderHook(() => useLumoHotkey({ isCurrentSurfaceOpen: false, openLumo }));
        const field = document.body.appendChild(document.createElement('input'));

        pressShiftL(field);

        expect(openLumo).not.toHaveBeenCalled();
        field.remove();
    });
});
