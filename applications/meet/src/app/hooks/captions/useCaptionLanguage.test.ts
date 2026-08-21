import { act, renderHook } from '@testing-library/react';

import type { MeetState } from '@proton/meet/store/rootReducer';
import { updateUserSettingsThunk } from '@proton/meet/store/slices/userSettings';

import { useLocalParticipantAttribute } from '../useLocalParticipantAttribute';
import { useCaptionLanguage } from './useCaptionLanguage';

const setValue = vi.fn();
const dispatch = vi.fn();

const state = vi.hoisted(() => ({
    isGuest: false,
    saveLanguagePreference: true,
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: (flag: string) => flag === 'MeetSaveCaptionLanguagePreference' && state.saveLanguagePreference,
}));

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: (state: MeetState) => unknown) =>
        selector({ meetUser: { isGuest: state.isGuest } } as unknown as MeetState),
    useMeetDispatch: () => dispatch,
}));

vi.mock('@proton/meet/store/slices/userSettings', () => ({
    updateUserSettingsThunk: vi.fn(() => ({ type: 'meet_user_settings/update' })),
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
    mockAttribute('');
});

describe('useCaptionLanguage', () => {
    it('reports auto-detect while no language is published', () => {
        const { result } = renderHook(() => useCaptionLanguage());

        expect(result.current.language).toBe('multi');
    });

    it('saves the picked language to the Meet user settings', async () => {
        const { result } = renderHook(() => useCaptionLanguage());

        await act(() => result.current.setLanguage('fr'));

        expect(setValue).toHaveBeenCalledWith('fr');
        expect(updateUserSettingsThunk).toHaveBeenCalledWith({ CaptionLanguage: 'fr' });
    });

    it('clears the published language when auto-detect is picked', async () => {
        mockAttribute('fr');

        const { result } = renderHook(() => useCaptionLanguage());

        await act(() => result.current.setLanguage('multi'));

        expect(setValue).toHaveBeenCalledWith('');
        expect(updateUserSettingsThunk).toHaveBeenCalledWith({ CaptionLanguage: 'multi' });
    });

    it('saves nothing for a guest, since they have no Meet settings', async () => {
        state.isGuest = true;

        const { result } = renderHook(() => useCaptionLanguage());

        await act(() => result.current.setLanguage('fr'));

        expect(setValue).toHaveBeenCalledWith('fr');
        expect(updateUserSettingsThunk).not.toHaveBeenCalled();
    });

    it('keeps the language out of the Meet user settings while saving is off', async () => {
        state.saveLanguagePreference = false;

        const { result } = renderHook(() => useCaptionLanguage());

        await act(() => result.current.setLanguage('fr'));

        expect(setValue).toHaveBeenCalledWith('fr');
        expect(updateUserSettingsThunk).not.toHaveBeenCalled();
    });

    it('does not save a language the room refused', async () => {
        setValue.mockRejectedValue(new Error('metadata update timed out'));

        const { result } = renderHook(() => useCaptionLanguage());

        await act(async () => {
            await expect(result.current.setLanguage('de')).rejects.toThrow();
        });

        expect(updateUserSettingsThunk).not.toHaveBeenCalled();
    });
});
