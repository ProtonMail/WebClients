import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { UserSettings } from '@proton/shared/lib/interfaces/Meet';

import { updateUserSettingsThunk, userSettingsReducer } from './userSettings';

vi.mock('@proton/shared/lib/helpers/sentry', () => ({
    captureMessage: vi.fn(),
}));

const isUpdate = (config: { method?: string }) => config.method === 'put';

const setup = ({ readFails = false }: { readFails?: boolean } = {}) => {
    let storedSettings: UserSettings = { MeetingID: 'meeting-id', AddressID: 'address-id', CaptionLanguage: 'de' };

    const api = vi.fn(async (config: { method?: string }) => {
        if (isUpdate(config)) {
            return {};
        }

        if (readFails) {
            throw new Error('offline');
        }

        return { UserSettings: storedSettings };
    });

    const store = configureStore({
        reducer: { ...userSettingsReducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: { extraArgument: { api } as unknown as ProtonThunkArguments },
            }),
    });

    const setStoredSettings = (next: UserSettings) => {
        storedSettings = next;
    };

    return { api, store, setStoredSettings };
};

describe('updateUserSettingsThunk', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sends the settings back as a whole, so the fields it does not touch survive', async () => {
        const { api, store } = setup();

        await store.dispatch(updateUserSettingsThunk({ CaptionLanguage: 'fr' })).unwrap();

        expect(api).toHaveBeenCalledWith({
            method: 'put',
            url: 'meet/v1/user-settings',
            data: { MeetingID: 'meeting-id', AddressID: 'address-id', CaptionLanguage: 'fr' },
        });
    });

    it('reads the settings again rather than trusting the cached copy', async () => {
        const { api, store, setStoredSettings } = setup();

        await store.dispatch(updateUserSettingsThunk({ CaptionLanguage: 'fr' })).unwrap();

        setStoredSettings({ MeetingID: 'rotated-meeting-id', AddressID: 'address-id', CaptionLanguage: 'fr' });

        await store.dispatch(updateUserSettingsThunk({ CaptionLanguage: 'de' })).unwrap();

        expect(api).toHaveBeenLastCalledWith({
            method: 'put',
            url: 'meet/v1/user-settings',
            data: { MeetingID: 'rotated-meeting-id', AddressID: 'address-id', CaptionLanguage: 'de' },
        });
    });

    it('keeps the cached settings in step with the change', async () => {
        const { store } = setup();

        await store.dispatch(updateUserSettingsThunk({ CaptionLanguage: 'fr' })).unwrap();

        expect(store.getState().meet_user_settings.value).toEqual({
            MeetingID: 'meeting-id',
            AddressID: 'address-id',
            CaptionLanguage: 'fr',
        });
    });

    it('writes nothing when the current settings cannot be read', async () => {
        const { api, store } = setup({ readFails: true });

        await expect(store.dispatch(updateUserSettingsThunk({ CaptionLanguage: 'fr' })).unwrap()).rejects.toThrow(
            'offline'
        );

        expect(api.mock.calls.some(([config]) => isUpdate(config))).toBe(false);
    });
});
