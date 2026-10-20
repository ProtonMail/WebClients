import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { MeetEventResponse, UserSettings } from '@proton/shared/lib/interfaces/Meet';

import type { MeetEventLoopRequiredState } from '../meetEventLoop/interface';
import { userSettingsReducer, userSettingsThunk } from '../slices/userSettings';
import { userSettingsLoop } from './index';

vi.mock('@proton/shared/lib/helpers/sentry', () => ({
    captureMessage: vi.fn(),
}));

const settings = (LiveCaptionsLocale: string | null): UserSettings => ({
    MeetingID: 'meeting-id',
    AddressID: 'address-id',
    LiveCaptionsLocale,
});

const setup = () => {
    let remote = settings('de_DE');
    const api = vi.fn(async () => ({ UserSettings: remote }));

    const store = configureStore({
        reducer: { ...userSettingsReducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: { extraArgument: { api } as unknown as ProtonThunkArguments },
            }),
    });

    const runLoop = (event: Partial<MeetEventResponse>) =>
        userSettingsLoop({
            event: event as MeetEventResponse,
            state: store.getState() as unknown as MeetEventLoopRequiredState,
            dispatch: store.dispatch,
            api: api as unknown as Api,
        });

    return {
        api,
        store,
        runLoop,
        setRemote: (next: UserSettings) => {
            remote = next;
        },
    };
};

describe('userSettingsLoop', () => {
    it('refetches the settings when they changed elsewhere', async () => {
        const { store, runLoop, setRemote } = setup();
        await store.dispatch(userSettingsThunk());
        setRemote(settings('fr_FR'));

        await runLoop({ MeetUserSettings: [{ ID: 'user-id', Action: 2 }] as MeetEventResponse['MeetUserSettings'] });

        expect(store.getState().meet_user_settings.value?.LiveCaptionsLocale).toBe('fr_FR');
    });

    it('ignores events without a settings change', async () => {
        const { api, store, runLoop } = setup();
        await store.dispatch(userSettingsThunk());
        api.mockClear();

        expect(runLoop({ MeetMeetings: [] })).toBeUndefined();
        expect(api).not.toHaveBeenCalled();
    });

    it('does not load settings that were never fetched', () => {
        const { api, runLoop } = setup();

        expect(
            runLoop({ MeetUserSettings: [{ ID: 'user-id', Action: 2 }] as MeetEventResponse['MeetUserSettings'] })
        ).toBeUndefined();
        expect(api).not.toHaveBeenCalled();
    });
});
