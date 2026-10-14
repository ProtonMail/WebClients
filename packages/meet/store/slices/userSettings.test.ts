import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { UserSettings } from '@proton/shared/lib/interfaces/Meet';

import { updateLiveCaptionsLocaleThunk, userSettingsReducer, userSettingsThunk } from './userSettings';

vi.mock('@proton/shared/lib/helpers/sentry', () => ({
    captureMessage: vi.fn(),
}));

const storedSettings: UserSettings = {
    MeetingID: 'meeting-id',
    AddressID: 'address-id',
    LiveCaptionsLocale: 'de_DE',
};

const setup = () => {
    const api = vi.fn(async (config: { method?: string; data?: { LiveCaptionsLocale: string | null } }) => {
        if (config.method === 'put') {
            return { UserSettings: { ...storedSettings, ...config.data } };
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

    return { api, store };
};

describe('updateLiveCaptionsLocaleThunk', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('writes only the locale, so the other settings are left alone', async () => {
        const { api, store } = setup();

        await store.dispatch(updateLiveCaptionsLocaleThunk('fr_FR')).unwrap();

        expect(api).toHaveBeenCalledWith({
            method: 'put',
            url: 'meet/v1/user-settings/live-captions-locale',
            data: { LiveCaptionsLocale: 'fr_FR' },
        });
    });

    it('sends null for auto-detect', async () => {
        const { api, store } = setup();

        await store.dispatch(updateLiveCaptionsLocaleThunk(null)).unwrap();

        expect(api).toHaveBeenCalledWith({
            method: 'put',
            url: 'meet/v1/user-settings/live-captions-locale',
            data: { LiveCaptionsLocale: null },
        });
    });

    it('keeps the cached settings in step with the change', async () => {
        const { store } = setup();

        await store.dispatch(userSettingsThunk());
        await store.dispatch(updateLiveCaptionsLocaleThunk('fr_FR')).unwrap();

        expect(store.getState().meet_user_settings.value).toEqual({
            MeetingID: 'meeting-id',
            AddressID: 'address-id',
            LiveCaptionsLocale: 'fr_FR',
        });
    });
});
