import { waitFor } from '@testing-library/react';

import { PLANS } from '@proton/payments/core/constants';
import type { Entitlements } from '@proton/payments/core/entitlements/interface';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';
import { type CataloguedPlan, buildOrganizationEntitlements } from '@proton/payments/testing/prodCatalogGrants';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-shared-store/test';
import { CacheType } from '@proton/redux-utilities/interface';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { bootstrapEvent } from '../../bootstrap/action';
import { entitlementsReducer, entitlementsThunk, selectEntitlements } from '../../entitlements';
import { ENTITLEMENTS_URL } from '../../entitlements/testing';
import { getModelState } from '../../testing/getModelState';
import { userReducer } from '../../user';
import { organizationReducer } from '../index';
import { serializeOrgTheme, syncToCookie } from './cookie';
import { organizationThemeListener } from './listener';
import { type OrganizationTheme, organizationThemeSlice, selectOrganizationTheme } from './slice';

jest.mock('./cookie', () => ({
    ...jest.requireActual('./cookie'),
    syncToCookie: jest.fn(),
}));

const mockedSyncToCookie = jest.mocked(syncToCookie);

const API_URL = 'https://mail.proton.me/api';
const UID = 'session-uid';
const localID = 0;

const organization = {
    ID: 'org-id',
    Name: 'Acme',
    Settings: { LogoID: 'logo-id', ShowName: true },
} as OrganizationExtended;

const completeOrganizationState = {
    ...getModelState(organization),
    meta: { ...getModelState(organization).meta, type: 1 },
};

const freeOrganizationState = {
    ...getModelState({ Settings: {} } as OrganizationExtended),
    meta: { ...getModelState(organization).meta, type: 0 },
};

const acmeTheme: OrganizationTheme = {
    access: true,
    name: 'Acme',
    showName: true,
    logoURL: `${API_URL}/core/v4/organizations/logo/logo-id?UID=${UID}`,
};

const noAccessTheme: OrganizationTheme = { access: false, name: '', showName: false, logoURL: '' };

const paidAdmin = { Subscribed: 1, isPaid: true, Role: USER_ROLES.ADMIN_ROLE } as UserModel;
const paidMember = { Subscribed: 1, isPaid: true, Role: USER_ROLES.MEMBER_ROLE } as UserModel;
const freeUser = { Subscribed: 0, isPaid: false } as UserModel;

const entitlementsForOrganizationOn = (plans: CataloguedPlan[]): Entitlements =>
    makeEntitlements(buildOrganizationEntitlements(plans));

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const acmeCookie = serializeOrgTheme(organization, localID);

const setup = ({
    user = paidAdmin,
    entitlements,
    organizationTheme = noAccessTheme,
}: {
    user?: UserModel;
    entitlements: Entitlements | Error;
    organizationTheme?: OrganizationTheme;
}) => {
    let serverEntitlements = entitlements;
    const api = jest.fn().mockImplementation(({ url }: { url: string }) => {
        if (url === ENTITLEMENTS_URL) {
            return serverEntitlements instanceof Error
                ? Promise.reject(serverEntitlements)
                : Promise.resolve(serverEntitlements);
        }
        return Promise.reject(new Error(`unexpected url ${url}`));
    });

    const { store, startListening } = getTestStore({
        reducer: {
            ...userReducer,
            ...organizationReducer,
            ...entitlementsReducer,
            organizationTheme: organizationThemeSlice.reducer,
        },
        preloadedState: {
            user: getModelState(user),
            organization: user.Subscribed ? completeOrganizationState : freeOrganizationState,
            organizationTheme,
        },
        extraThunkArguments: {
            api,
            authentication: { UID, localID },
            config: { API_URL },
        } as unknown as ProtonThunkArguments,
    });

    organizationThemeListener(startListening);

    return {
        store,
        bootstrap: async () => {
            store.dispatch(bootstrapEvent({ type: 'complete' }));
            await waitFor(() => {
                const { value, error } = selectEntitlements(store.getState());
                expect(value ?? error).toBeDefined();
            });
            await settle();
        },
        entitlementsRequests: () =>
            api.mock.calls.filter(([request]: [{ url: string }]) => request.url === ENTITLEMENTS_URL).length,
        setServerEntitlements: (next: Entitlements) => {
            serverEntitlements = next;
        },
    };
};

describe('organizationThemeListener', () => {
    beforeEach(() => {
        mockedSyncToCookie.mockClear();
    });

    it.each([
        { plans: [PLANS.PASS_BUSINESS], theme: acmeTheme, cookie: acmeCookie },
        { plans: [PLANS.LUMO_BUSINESS], theme: acmeTheme, cookie: acmeCookie },
        { plans: [PLANS.MAIL_PRO, PLANS.VPN_BUSINESS], theme: acmeTheme, cookie: acmeCookie },
        { plans: [PLANS.MAIL_PRO], theme: noAccessTheme, cookie: undefined },
        { plans: [PLANS.FAMILY], theme: noAccessTheme, cookie: undefined },
    ] as const)('sets access to $theme.access for an organization on $plans', async ({ plans, theme, cookie }) => {
        const { store, bootstrap } = setup({ entitlements: entitlementsForOrganizationOn([...plans]) });

        await bootstrap();

        expect(selectOrganizationTheme(store.getState())).toEqual(theme);
        expect(mockedSyncToCookie).toHaveBeenLastCalledWith(cookie);
    });

    it('keeps the logo for a member of a passbiz2024 organization, from the organization entitlements', async () => {
        const { store, bootstrap } = setup({
            user: paidMember,
            entitlements: entitlementsForOrganizationOn([PLANS.PASS_BUSINESS]),
        });

        await bootstrap();

        expect(selectOrganizationTheme(store.getState())).toEqual(acmeTheme);
        expect(mockedSyncToCookie.mock.calls).toEqual([[acmeCookie]]);
    });

    it('shows no logo to a free user, without requesting entitlements', async () => {
        const { store, entitlementsRequests } = setup({ user: freeUser, entitlements: makeEntitlements() });

        store.dispatch(bootstrapEvent({ type: 'complete' }));
        await settle();

        expect(entitlementsRequests()).toBe(0);
        expect(selectOrganizationTheme(store.getState())).toEqual(noAccessTheme);
        expect(mockedSyncToCookie).toHaveBeenLastCalledWith(undefined);
    });

    it('waits for the entitlements before deciding, without touching the theme or the cookie', async () => {
        const { store } = setup({
            entitlements: entitlementsForOrganizationOn([PLANS.PASS_BUSINESS]),
            organizationTheme: acmeTheme,
        });

        store.dispatch(bootstrapEvent({ type: 'complete' }));

        expect(selectEntitlements(store.getState()).value).toBeUndefined();
        expect(selectOrganizationTheme(store.getState())).toEqual(acmeTheme);
        expect(mockedSyncToCookie).not.toHaveBeenCalled();
    });

    it('uses entitlements that are already loaded without requesting them again', async () => {
        const { store, bootstrap, entitlementsRequests } = setup({
            entitlements: entitlementsForOrganizationOn([PLANS.PASS_BUSINESS]),
        });
        await bootstrap();
        mockedSyncToCookie.mockClear();

        store.dispatch(bootstrapEvent({ type: 'complete' }));
        await settle();

        expect(entitlementsRequests()).toBe(1);
        expect(mockedSyncToCookie.mock.calls).toEqual([[acmeCookie]]);
    });

    it('leaves the theme and the cookie as they were when entitlements fail to load', async () => {
        const { store, bootstrap, entitlementsRequests } = setup({
            entitlements: new Error('entitlements unavailable'),
            organizationTheme: acmeTheme,
        });

        await bootstrap();

        expect(entitlementsRequests()).toBe(1);
        expect(selectOrganizationTheme(store.getState())).toEqual(acmeTheme);
        expect(mockedSyncToCookie).not.toHaveBeenCalled();
    });

    it('updates the theme when the entitlements change, and settles without refetching', async () => {
        const { store, bootstrap, entitlementsRequests, setServerEntitlements } = setup({
            entitlements: entitlementsForOrganizationOn([PLANS.MAIL_PRO]),
        });

        await bootstrap();
        expect(selectOrganizationTheme(store.getState())).toEqual(noAccessTheme);

        setServerEntitlements(entitlementsForOrganizationOn([PLANS.MAIL_PRO, PLANS.PASS_BUSINESS]));
        await store.dispatch(entitlementsThunk({ cache: CacheType.None }));

        await settle();

        expect(selectOrganizationTheme(store.getState())).toEqual(acmeTheme);
        expect(entitlementsRequests()).toBe(2);
    });
});
