import { combineReducers } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-shared-store/test';
import { APPS, USER_ROLES } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { buildUser } from '@proton/shared/testing/buildUser';

import { bootstrapEvent } from '../bootstrap/action';
import { organizationReducer } from '../organization';
import { getModelState } from '../testing/getModelState';
import { userReducer } from '../user';
import { availableAppsReducer, fetchAvailableApps, selectAvailableApps } from './index';
import { availableAppsListener } from './listener';

const reducer = combineReducers({ ...userReducer, ...organizationReducer, ...availableAppsReducer });

const everyApp = [
    APPS.PROTONMAIL,
    APPS.PROTONCALENDAR,
    APPS.PROTONVPN_SETTINGS,
    APPS.PROTONDRIVE,
    APPS.PROTONDOCS,
    APPS.PROTONSHEETS,
    APPS.PROTONPASS,
    APPS.PROTONWALLET,
    APPS.PROTONLUMO,
    APPS.PROTONMEET,
    APPS.PROTONSPACES,
];

const setup = ({
    user = {},
    isSpacesAvailable = true,
    allowedProducts = ['All'],
    organization,
    isOrganizationPersisted = false,
}: {
    user?: Partial<UserModel>;
    isSpacesAvailable?: boolean;
    allowedProducts?: string[];
    organization?: OrganizationExtended;
    /** Loaded from a previous page, which the persisted state doesn't mark as fetched by this one */
    isOrganizationPersisted?: boolean;
} = {}) => {
    const api = jest.fn(async () => ({ AllowedProducts: allowedProducts }));
    const unleashClient = { isEnabled: jest.fn((flag: string) => flag === 'SpacesAvailable' && isSpacesAvailable) };
    const extraThunkArguments = {
        api,
        unleashClient,
        config: { APP_NAME: APPS.PROTONMAIL },
    } as unknown as ProtonThunkArguments;
    return {
        api,
        ...getTestStore({
            reducer,
            preloadedState: {
                user: getModelState(buildUser({ Subscribed: 0, ...user })),
                // A complete organization, as the organization thunk stores it, rather than a dummy one
                ...(organization && {
                    organization: {
                        ...getModelState(organization),
                        meta: {
                            ...getModelState(organization).meta,
                            type: 1,
                            ...(isOrganizationPersisted && { fetchedEphemeral: undefined }),
                        },
                    },
                }),
                availableApps: [],
            },
            extraThunkArguments,
        }),
    };
};

describe('fetchAvailableApps', () => {
    it('stores every app, in app switcher order', async () => {
        const { store, api } = setup();

        await store.dispatch(fetchAvailableApps());

        expect(selectAvailableApps(store.getState())).toEqual(everyApp);
        // Without a subscription there's no organization to restrict the apps
        expect(api).not.toHaveBeenCalled();
    });

    it('leaves out Spaces when its feature flag is off', async () => {
        const { store } = setup({ isSpacesAvailable: false });

        await store.dispatch(fetchAvailableApps());

        expect(selectAvailableApps(store.getState())).not.toContain(APPS.PROTONSPACES);
    });

    it('keeps the apps the organization allows a member, with Mail and Calendar together', async () => {
        const { store, api } = setup({
            user: { Subscribed: 1, Role: USER_ROLES.MEMBER_ROLE },
            allowedProducts: ['Calendar', 'Pass'],
        });

        await store.dispatch(fetchAvailableApps());

        expect(selectAvailableApps(store.getState())).toEqual([APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONPASS]);
        expect(api).toHaveBeenCalledWith(expect.objectContaining({ url: 'core/v4/organizations/settings' }));
    });

    it("uses the store's organization rather than fetching its settings again", async () => {
        const { store, api } = setup({
            user: { Subscribed: 1, Role: USER_ROLES.MEMBER_ROLE },
            organization: { Settings: { AllowedProducts: ['Pass'] } } as OrganizationExtended,
        });

        await store.dispatch(fetchAvailableApps());

        expect(selectAvailableApps(store.getState())).toEqual([APPS.PROTONPASS]);
        expect(api).not.toHaveBeenCalled();
    });

    it("doesn't restrict an organization admin", async () => {
        const { store } = setup({
            user: { Subscribed: 1, Role: USER_ROLES.ADMIN_ROLE },
            allowedProducts: ['Pass'],
        });

        await store.dispatch(fetchAvailableApps());

        expect(selectAvailableApps(store.getState())).toEqual(everyApp);
    });

    it('only lets an SSO account without keys use VPN', async () => {
        const { store } = setup({ user: { Keys: [], Flags: { ...buildUser().Flags, sso: true } } });

        await store.dispatch(fetchAvailableApps());

        expect(selectAvailableApps(store.getState())).toEqual([APPS.PROTONVPN_SETTINGS]);
    });
});

describe('availableAppsListener', () => {
    it('gets the apps at bootstrap', async () => {
        const { store, startListening } = setup();
        availableAppsListener(startListening);

        store.dispatch(bootstrapEvent({ type: 'complete' }));

        await waitFor(() => expect(selectAvailableApps(store.getState())).toEqual(everyApp));
    });

    it("follows the organization's allowed products from the API over a persisted copy", async () => {
        const { store, startListening } = setup({
            user: { Subscribed: 1, Role: USER_ROLES.MEMBER_ROLE },
            organization: { Settings: { AllowedProducts: ['Pass', 'VPN'] } } as OrganizationExtended,
            isOrganizationPersisted: true,
            allowedProducts: ['Pass'],
        });
        availableAppsListener(startListening);

        store.dispatch(bootstrapEvent({ type: 'complete' }));

        await waitFor(() => expect(selectAvailableApps(store.getState())).toEqual([APPS.PROTONPASS]));
    });
});
