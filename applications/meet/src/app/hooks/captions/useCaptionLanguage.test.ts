import { act, renderHook } from '@testing-library/react';

import type { MeetState } from '@proton/meet/store/rootReducer';
import { updateLiveCaptionsLocaleThunk } from '@proton/meet/store/slices/userSettings';

import { useLocalParticipantAttribute } from '../useLocalParticipantAttribute';
import { useCaptionLanguage, useRestoreCaptionLanguage } from './useCaptionLanguage';

const setValue = vi.fn();
const dispatch = vi.fn();

const state = vi.hoisted(() => ({
    isGuest: false,
    saveLanguagePreference: true,
    savedLocale: null as string | null,
    joinedRoom: true,
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: (flag: string) => flag === 'MeetSaveCaptionLanguagePreference' && state.saveLanguagePreference,
}));

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: (state: MeetState) => unknown) =>
        selector({
            meetUser: { isGuest: state.isGuest },
            connection: { joinedRoom: state.joinedRoom },
            meet_user_settings: { value: { LiveCaptionsLocale: state.savedLocale } },
        } as unknown as MeetState),
    useMeetDispatch: () => dispatch,
}));

vi.mock('@proton/meet/store/slices/userSettings', () => ({
    selectUserSettings: (state: MeetState) => (state as unknown as Record<string, unknown>).meet_user_settings,
    updateLiveCaptionsLocaleThunk: vi.fn(() => ({ type: 'meet_user_settings/updateLiveCaptionsLocale' })),
}));

vi.mock('../useLocalParticipantAttribute', () => ({
    useLocalParticipantAttribute: vi.fn(),
}));

const mockAttribute = (value: string) => {
    vi.mocked(useLocalParticipantAttribute).mockReturnValue({ value, setValue });
};

beforeEach(() => {
    vi.clearAllMocks();
    setValue.mockResolvedValue(undefined);
    dispatch.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    state.isGuest = false;
    state.saveLanguagePreference = true;
    state.savedLocale = null;
    state.joinedRoom = true;
    mockAttribute('');
});

describe('useCaptionLanguage', () => {
    it('reports auto-detect while no language is published', () => {
        const { result } = renderHook(() => useCaptionLanguage());

        expect(result.current.language).toBe('multi');
    });

    it('saves the locale for the picked language to the Meet user settings', async () => {
        const { result } = renderHook(() => useCaptionLanguage());

        await act(() => result.current.setLanguage('fr'));

        expect(setValue).toHaveBeenCalledWith('fr');
        expect(updateLiveCaptionsLocaleThunk).toHaveBeenCalledWith('fr_FR');
    });

    it('clears the published language when auto-detect is picked', async () => {
        mockAttribute('fr');

        const { result } = renderHook(() => useCaptionLanguage());

        await act(() => result.current.setLanguage('multi'));

        expect(setValue).toHaveBeenCalledWith('');
        expect(updateLiveCaptionsLocaleThunk).toHaveBeenCalledWith(null);
    });

    it('saves nothing for a guest, since they have no Meet settings', async () => {
        state.isGuest = true;

        const { result } = renderHook(() => useCaptionLanguage());

        await act(() => result.current.setLanguage('fr'));

        expect(setValue).toHaveBeenCalledWith('fr');
        expect(updateLiveCaptionsLocaleThunk).not.toHaveBeenCalled();
    });

    it('keeps the language out of the Meet user settings while saving is off', async () => {
        state.saveLanguagePreference = false;

        const { result } = renderHook(() => useCaptionLanguage());

        await act(() => result.current.setLanguage('fr'));

        expect(setValue).toHaveBeenCalledWith('fr');
        expect(updateLiveCaptionsLocaleThunk).not.toHaveBeenCalled();
    });

    it('does not save a language the room refused', async () => {
        setValue.mockRejectedValue(new Error('metadata update timed out'));

        const { result } = renderHook(() => useCaptionLanguage());

        await act(async () => {
            await expect(result.current.setLanguage('de')).rejects.toThrow();
        });

        expect(updateLiveCaptionsLocaleThunk).not.toHaveBeenCalled();
    });
});

describe('useRestoreCaptionLanguage', () => {
    it('publishes the stored preference, which the participant does not carry over from the last join', () => {
        state.savedLocale = 'fr_FR';

        renderHook(() => useRestoreCaptionLanguage());

        expect(setValue).toHaveBeenCalledWith('fr');
    });

    it('waits for the room before publishing', () => {
        state.savedLocale = 'fr_FR';
        state.joinedRoom = false;

        const { rerender } = renderHook(() => useRestoreCaptionLanguage());

        expect(setValue).not.toHaveBeenCalled();

        state.joinedRoom = true;
        rerender();

        expect(setValue).toHaveBeenCalledWith('fr');
    });

    it('publishes nothing when the stored preference is auto-detect', () => {
        renderHook(() => useRestoreCaptionLanguage());

        expect(setValue).not.toHaveBeenCalled();
    });

    it('leaves a language the room already has alone', () => {
        state.savedLocale = 'fr_FR';
        mockAttribute('de');

        renderHook(() => useRestoreCaptionLanguage());

        expect(setValue).not.toHaveBeenCalled();
    });

    it('restores nothing for a guest, who has no Meet settings', () => {
        state.savedLocale = 'fr_FR';
        state.isGuest = true;

        renderHook(() => useRestoreCaptionLanguage());

        expect(setValue).not.toHaveBeenCalled();
    });

    it('restores nothing while saving is off', () => {
        state.savedLocale = 'fr_FR';
        state.saveLanguagePreference = false;

        renderHook(() => useRestoreCaptionLanguage());

        expect(setValue).not.toHaveBeenCalled();
    });

    it('does not undo a switch back to auto-detect', () => {
        state.savedLocale = 'fr_FR';

        const { rerender } = renderHook(() => useRestoreCaptionLanguage());

        // The preference is saved after the room accepts the change, so the locale trails it.
        mockAttribute('');
        rerender();

        expect(setValue).toHaveBeenCalledTimes(1);
    });

    it('publishes again on the next join', () => {
        state.savedLocale = 'fr_FR';

        const { rerender } = renderHook(() => useRestoreCaptionLanguage());

        state.joinedRoom = false;
        rerender();

        state.joinedRoom = true;
        rerender();

        expect(setValue).toHaveBeenCalledTimes(2);
    });
});
