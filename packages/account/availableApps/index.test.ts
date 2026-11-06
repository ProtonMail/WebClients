import { combineReducers } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { buildUser } from '@proton/shared/testing/buildUser';

import { bootstrapEvent } from '../bootstrap/action';
import { getModelState } from '../testing/getModelState';
import { userReducer } from '../user';
import { getAvailableAppsFromResponse } from './apps';
import { availableAppsReducer, fetchAvailableApps, selectAvailableApps } from './index';
import { availableAppsListener } from './listener';

const reducer = combineReducers({ ...userReducer, ...availableAppsReducer });

const setup = ({
    availableApps = [],
    api,
    user = {},
}: {
    availableApps?: APP_NAMES[];
    api: jest.Mock;
    user?: Partial<UserModel>;
}) => {
    const extraThunkArguments = { api } as unknown as ProtonThunkArguments;
    return getTestStore({
        reducer,
        preloadedState: { user: getModelState(buildUser(user)), availableApps },
        extraThunkArguments,
    });
};

const toResponse = (products: string[]) => ({ Apps: products.map((Product) => ({ Product, Tier: null })) });

describe('getAvailableAppsFromResponse', () => {
    it('maps products to apps with their tier, leaving out unknown ones', () => {
        expect(
            getAvailableAppsFromResponse([
                { Product: 'VPN', Tier: null },
                { Product: 'Sheets', Tier: 'Plus' },
                { Product: 'Unknown', Tier: null },
                { Product: 'Mail', Tier: 'Professional' },
            ])
        ).toEqual([
            { app: APPS.PROTONVPN_SETTINGS, tier: null },
            { app: APPS.PROTONSHEETS, tier: 'Plus' },
            { app: APPS.PROTONMAIL, tier: 'Professional' },
        ]);
    });
});

describe('fetchAvailableApps', () => {
    it('stores the apps from the API, in app switcher order', async () => {
        const api = jest.fn(async () => toResponse(['Drive', 'Mail', 'Calendar']));
        const { store } = setup({ api });

        await store.dispatch(fetchAvailableApps());

        expect(selectAvailableApps(store.getState())).toEqual([APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE]);
        expect(api).toHaveBeenCalledWith(expect.objectContaining({ url: 'core/v4/users/apps', silence: true }));
    });

    it('stores no apps in an MSP session, without asking the API', async () => {
        const api = jest.fn(async () => toResponse(['Mail']));
        const { store } = setup({ api, user: { Flags: { ...buildUser().Flags, 'org-access': true } } });

        await store.dispatch(fetchAvailableApps());

        expect(selectAvailableApps(store.getState())).toEqual([]);
        expect(api).not.toHaveBeenCalled();
    });

    it('keeps the last list when the API fails', async () => {
        const api = jest.fn(async () => {
            throw new Error('Offline');
        });
        const { store } = setup({ api, availableApps: [APPS.PROTONMAIL, APPS.PROTONCALENDAR] });

        await expect(store.dispatch(fetchAvailableApps())).rejects.toThrow('Offline');

        expect(selectAvailableApps(store.getState())).toEqual([APPS.PROTONMAIL, APPS.PROTONCALENDAR]);
    });
});

describe('availableAppsListener', () => {
    it('fetches the apps at bootstrap', async () => {
        const api = jest.fn(async () => toResponse(['Mail', 'Drive']));
        const { store, startListening } = setup({ api });
        availableAppsListener(startListening);

        store.dispatch(bootstrapEvent({ type: 'complete' }));

        await waitFor(() => expect(selectAvailableApps(store.getState())).toEqual([APPS.PROTONMAIL, APPS.PROTONDRIVE]));
        expect(api).toHaveBeenCalledTimes(1);
    });
});
