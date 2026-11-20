import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import { addressesReducer } from '@proton/account/addresses';
import { organizationReducer } from '@proton/account/organization';
import { organizationKeyReducer } from '@proton/account/organizationKey';
import { getModelState } from '@proton/account/testing/getModelState';
import { getOrganizationState } from '@proton/account/testing/redux-state';
import { userPermissionsReducer } from '@proton/account/userPermissions';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import { DOMAIN_STATE } from '@proton/shared/lib/interfaces/Domain';
import type { ServiceAccount } from '@proton/shared/lib/interfaces/ServiceAccount';
import { ServiceAccountState } from '@proton/shared/lib/interfaces/ServiceAccount';

import {
    ServiceAccountSetupError,
    checkServiceAccountEmail,
    createServiceAccount,
    deleteServiceAccount,
    saveServiceAccount,
    setServiceAccountEnabled,
} from './actions';
import {
    clearServiceAccountKeys,
    getServiceAccountAccessPayload,
    getServiceAccountKeys,
    setupServiceAccountKeys,
} from './keys';
import { removeServiceAccount, serviceAccountsReducer, serviceAccountsThunk } from './slice';

vi.mock('@proton/account/kt/actions', () => ({ getKTUserContext: () => async () => ({}) }));
let mockDomains: object[];
vi.mock('@proton/account/domains', () => ({ domainsThunk: () => async () => mockDomains }));
vi.mock('./keys', () => ({
    setupServiceAccountKeys: vi.fn(async () => undefined),
    getServiceAccountKeys: vi.fn(async () => ({
        memberUserKeys: [],
        sourceAddressID: 'service-address',
        sourceKey: {},
    })),
    clearServiceAccountKeys: vi.fn(async () => undefined),
    getServiceAccountAccessPayload: vi.fn(async () => ({
        TargetEmail: 'new@example.test',
        SourceAddressID: 'service-address',
        UserKeyToken: 'encrypted-token',
        UserKeys: [],
    })),
}));

const api = vi.fn();
const current = {
    MemberID: 'service-member',
    UserID: 'service-user',
    AddressID: 'service-address',
    Name: 'ci-bot',
    Email: 'ci-bot@example.test',
    State: ServiceAccountState.Active,
    CreateTime: 1,
    Managers: [{ MemberID: 'old-manager', DelegatedAccessID: 'old-access' }],
} satisfies ServiceAccount;
const replacement = { MemberID: 'new-manager', Name: 'New manager', Email: 'new@example.test' };
let permissions: Record<string, boolean>;

const setup = ({ hasOrgKey = true, organizationHasKeys = true } = {}) => {
    const { store } = getTestStore({
        reducer: {
            ...serviceAccountsReducer,
            ...userPermissionsReducer,
            ...organizationReducer,
            ...organizationKeyReducer,
            ...addressesReducer,
        },
        preloadedState: {
            serviceAccounts: getInitialModelState<ServiceAccount[]>(),
            userPermissions: getModelState({ permissions } as any),
            organization: getOrganizationState({ HasKeys: organizationHasKeys ? 1 : 0 } as any),
            organizationKey: getModelState({
                Key: hasOrgKey ? { PrivateKey: 'armored-organization-key' } : {},
                privateKey: hasOrgKey ? {} : undefined,
            } as any),
            addresses: getModelState([]),
        },
        extraThunkArguments: { api, config: { APP_NAME: 'proton-account' } } as any,
    });
    // The thunks declare more state than these tests need.
    return store as typeof store & { dispatch: ThunkDispatch<any, any, UnknownAction> };
};
const mutations = () => api.mock.calls.map(([request]) => request).filter(({ method }) => method !== 'get');

beforeEach(() => {
    vi.clearAllMocks();
    permissions = {
        'account.user.update': true,
        'account.service_account.create': true,
        'account.service_account.delete': true,
        'account.service_account.update': true,
    };
    api.mockImplementation(async () => ({ ServiceAccounts: [current] }));
    mockDomains = [
        { DomainName: 'example.test', State: DOMAIN_STATE.DOMAIN_STATE_VERIFIED, Flags: { 'mail-intent': true } },
    ];
});

describe('saveServiceAccount', () => {
    it('adds replacement managers before removing the previous manager', async () => {
        await setup().dispatch(saveServiceAccount({ account: current, name: current.Name, managers: [replacement] }));
        expect(mutations().map(({ method, url }) => ({ method, url }))).toEqual([
            { method: 'post', url: 'account/v1/service-accounts/service-member/access' },
            { method: 'delete', url: 'account/v1/service-accounts/service-member/access/old-access' },
        ]);
    });

    it('does not duplicate a grant that already succeeded during a previous save', async () => {
        const updated = {
            ...current,
            Managers: [...current.Managers, { MemberID: replacement.MemberID, DelegatedAccessID: 'new-access' }],
        };
        api.mockImplementation(async () => ({ ServiceAccounts: [updated] }));
        await setup().dispatch(saveServiceAccount({ account: current, name: current.Name, managers: [replacement] }));
        expect(getServiceAccountAccessPayload).not.toHaveBeenCalled();
        expect(mutations().filter(({ method }) => method === 'post')).toHaveLength(0);
    });

    it.each([
        ['removing', [] as (typeof replacement)[]],
        ['adding', [{ MemberID: 'old-manager', Name: '', Email: '' }, replacement]],
    ])('rejects %s managers without the manage permission before key work', async (_, managers) => {
        permissions['account.service_account.update'] = false;
        await expect(
            setup().dispatch(saveServiceAccount({ account: current, name: current.Name, managers }))
        ).rejects.toThrow('permission');
        expect(setupServiceAccountKeys).not.toHaveBeenCalled();
        expect(mutations()).toHaveLength(0);
    });

    it('renames and removes managers without the organization key or key setup, then refetches', async () => {
        await setup({ hasOrgKey: false }).dispatch(
            saveServiceAccount({ account: current, name: 'renamed-bot', managers: [] })
        );
        expect(setupServiceAccountKeys).not.toHaveBeenCalled();
        expect(api.mock.calls.map(([{ method, url }]) => `${method} ${url}`)).toEqual([
            'get account/v1/service-accounts',
            'put core/v4/members/service-member/name',
            'delete account/v1/service-accounts/service-member/access/old-access',
            'get account/v1/service-accounts',
        ]);
    });

    it('requires the organization key to add managers', async () => {
        await expect(
            setup({ hasOrgKey: false }).dispatch(
                saveServiceAccount({ account: current, name: current.Name, managers: [replacement] })
            )
        ).rejects.toThrow('The organization key must be activated first.');
        expect(mutations()).toHaveLength(0);
    });

    it('validates the organization key like other member key flows', async () => {
        await expect(
            setup({ organizationHasKeys: false }).dispatch(
                saveServiceAccount({ account: current, name: current.Name, managers: [replacement] })
            )
        ).rejects.toThrow('Organization key does not exist.');
        expect(setupServiceAccountKeys).not.toHaveBeenCalled();
        expect(mutations()).toHaveLength(0);
    });

    it('sets up keys for a newly created account even when no managers are selected', async () => {
        await setup().dispatch(
            saveServiceAccount({
                account: { ...current, Managers: [] },
                name: current.Name,
                managers: [],
                setupKeys: true,
            })
        );
        expect(setupServiceAccountKeys).toHaveBeenCalledTimes(1);
        expect(getServiceAccountKeys).not.toHaveBeenCalled();
    });

    it('decrypts the service account keys once when adding several managers', async () => {
        const another = { MemberID: 'another-manager', Name: 'Another', Email: 'another@example.test' };
        await setup().dispatch(
            saveServiceAccount({
                account: current,
                name: current.Name,
                managers: [{ MemberID: 'old-manager', Name: '', Email: '' }, replacement, another],
            })
        );
        expect(getServiceAccountKeys).toHaveBeenCalledTimes(1);
        expect(getServiceAccountAccessPayload).toHaveBeenCalledTimes(2);
    });

    it('clears the decrypted service account keys even when preparing a grant fails', async () => {
        vi.mocked(getServiceAccountAccessPayload).mockRejectedValueOnce(new Error('no keys'));
        await expect(
            setup().dispatch(saveServiceAccount({ account: current, name: current.Name, managers: [replacement] }))
        ).rejects.toThrow('no keys');
        expect(clearServiceAccountKeys).toHaveBeenCalledTimes(1);
        expect(mutations()).toHaveLength(0);
    });

    it('preserves managers added by another admin while the editor was open', async () => {
        const updated = {
            ...current,
            Managers: [...current.Managers, { MemberID: 'concurrent-manager', DelegatedAccessID: 'concurrent-access' }],
        };
        api.mockImplementation(async () => ({ ServiceAccounts: [updated] }));
        await setup().dispatch(saveServiceAccount({ account: current, name: current.Name, managers: [replacement] }));
        expect(mutations().filter(({ method }) => method === 'delete')).toEqual([
            { method: 'delete', url: 'account/v1/service-accounts/service-member/access/old-access' },
        ]);
    });

    it('does not overwrite a concurrent rename when only managers were changed', async () => {
        api.mockImplementation(async () => ({ ServiceAccounts: [{ ...current, Name: 'renamed-by-another-admin' }] }));
        await setup().dispatch(saveServiceAccount({ account: current, name: current.Name, managers: [replacement] }));
        expect(mutations().filter(({ method }) => method === 'put')).toHaveLength(0);
    });

    it('refreshes the list when a save fails part way', async () => {
        api.mockImplementation(async ({ method }) => {
            if (method === 'delete') {
                throw new Error('offline');
            }
            return method === 'get' ? { ServiceAccounts: [current] } : {};
        });
        await expect(
            setup().dispatch(saveServiceAccount({ account: current, name: 'renamed-bot', managers: [] }))
        ).rejects.toThrow('offline');
        expect(api.mock.calls.map(([{ method }]) => method)).toEqual(['get', 'put', 'delete', 'get']);
    });

    it('rejects when the service account no longer exists', async () => {
        api.mockImplementation(async () => ({ ServiceAccounts: [] }));
        await expect(
            setup().dispatch(saveServiceAccount({ account: current, name: current.Name, managers: [] }))
        ).rejects.toThrow('no longer exists');
    });
});

describe('createServiceAccount', () => {
    const created = { ...current, Managers: [], State: ServiceAccountState.NoManager };
    const posts = () =>
        mutations().filter(({ method, url }) => method === 'post' && url === 'account/v1/service-accounts');
    const mockCreation = (response: object = created) =>
        api.mockImplementation(async ({ method, url }) => {
            if (method === 'post' && url === 'account/v1/service-accounts') {
                return { ServiceAccount: response };
            }
            return method === 'get' ? { ServiceAccounts: [created] } : {};
        });

    it('uses the name as address on the first active custom domain', async () => {
        mockDomains = [
            { DomainName: 'unverified.test', State: DOMAIN_STATE.DOMAIN_STATE_DEFAULT, Flags: { 'mail-intent': true } },
            ...mockDomains,
        ];
        mockCreation();
        await setup().dispatch(createServiceAccount({ name: 'CI Bot', managers: [] }));
        expect(api).toHaveBeenCalledWith({
            method: 'post',
            url: 'account/v1/service-accounts',
            data: {
                Name: 'CI Bot',
                Email: 'ci-bot@example.test',
                Local: 'ci-bot',
                Domain: 'example.test',
            },
            silence: true,
        });
    });

    it('creates the account with an address found earlier, without looking again', async () => {
        mockCreation();
        await setup().dispatch(createServiceAccount({ name: 'ci-bot', email: 'ci-bot2@example.test', managers: [] }));
        expect(api).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'core/v4/members/addresses/available' }));
        expect(posts()[0].data).toMatchObject({ Email: 'ci-bot2@example.test', Local: 'ci-bot2' });
    });

    it('creates the account, then sets up its keys and managers', async () => {
        mockCreation();
        await setup().dispatch(createServiceAccount({ name: 'ci-bot', managers: [replacement] }));
        expect(posts()).toHaveLength(1);
        expect(setupServiceAccountKeys).toHaveBeenCalledTimes(1);
        expect(getServiceAccountAccessPayload).toHaveBeenCalledTimes(1);
    });

    it('reports a failed setup with the created account, and reuses it on retry', async () => {
        // The creation response has no managers or state: the new account has no manager yet.
        const { Managers, State, ...response } = created;
        mockCreation(response);
        vi.mocked(setupServiceAccountKeys).mockRejectedValueOnce(new Error('Key setup unavailable'));
        const store = setup();
        const error = await store
            .dispatch(createServiceAccount({ name: 'ci-bot', managers: [] }))
            .catch((e: unknown) => e);
        expect(error).toBeInstanceOf(ServiceAccountSetupError);
        expect(error).toMatchObject({ account: created, message: 'Key setup unavailable' });

        await store.dispatch(createServiceAccount({ pending: created, name: 'ci-bot', managers: [] }));
        expect(posts()).toHaveLength(1);
        expect(setupServiceAccountKeys).toHaveBeenCalledTimes(2);
    });

    it('rejects without an active custom domain, since Proton domains are not accepted', async () => {
        mockDomains = [];
        await expect(setup().dispatch(createServiceAccount({ name: 'ci-bot', managers: [] }))).rejects.toThrow(
            'custom domain'
        );
        expect(api).not.toHaveBeenCalled();
    });

    it('rejects without the create permission', async () => {
        permissions['account.service_account.create'] = false;
        await expect(setup().dispatch(createServiceAccount({ name: 'ci-bot', managers: [] }))).rejects.toThrow(
            'permission'
        );
        expect(api).not.toHaveBeenCalled();
    });
});

describe('checkServiceAccountEmail', () => {
    const checked = () =>
        api.mock.calls
            .map(([request]) => request)
            .filter(({ url }) => url === 'core/v4/members/addresses/available')
            .map(({ data }) => `${data.Local}@${data.Domain}`);
    const taken = (...emails: string[]) =>
        api.mockImplementation(async ({ data }) => {
            if (emails.includes(`${data.Local}@${data.Domain}`)) {
                throw { status: 409, data: { Code: 2500, Error: 'Address is already taken' } };
            }
            return {};
        });

    it('uses the address the name gets when it is free', async () => {
        taken();
        await expect(setup().dispatch(checkServiceAccountEmail('CI Bot'))).resolves.toEqual({
            email: 'ci-bot@example.test',
        });
        expect(api).toHaveBeenCalledWith({
            method: 'post',
            url: 'core/v4/members/addresses/available',
            data: { Local: 'ci-bot', Domain: 'example.test' },
            silence: true,
        });
    });

    it('adds a number after the name until the address is free', async () => {
        taken('ci-bot@example.test', 'ci-bot2@example.test');
        await expect(setup().dispatch(checkServiceAccountEmail('ci-bot'))).resolves.toEqual({
            email: 'ci-bot3@example.test',
        });
        expect(checked()).toEqual(['ci-bot@example.test', 'ci-bot2@example.test', 'ci-bot3@example.test']);
    });

    it('gives up after a bounded number of taken addresses', async () => {
        api.mockRejectedValue({ status: 409, data: { Code: 2500, Error: 'Address is already taken' } });
        await expect(setup().dispatch(checkServiceAccountEmail('ci-bot'))).resolves.toEqual({
            error: 'No free address was found for this name. Try another name.',
        });
        expect(checked()).toHaveLength(20);
    });

    it('reports why the address cannot be used', async () => {
        api.mockRejectedValue({ status: 422, data: { Code: 2011, Error: 'Domain is not verified' } });
        await expect(setup().dispatch(checkServiceAccountEmail('ci-bot'))).resolves.toEqual({
            error: 'Domain is not verified',
        });
    });

    it('resolves with neither when the check itself fails, since creating looks again', async () => {
        api.mockRejectedValue({ status: 500 });
        await expect(setup().dispatch(checkServiceAccountEmail('ci-bot'))).resolves.toEqual({});
    });

    it('reports a missing custom domain without calling the API', async () => {
        mockDomains = [];
        await expect(setup().dispatch(checkServiceAccountEmail('ci-bot'))).resolves.toEqual({
            error: expect.stringContaining('custom domain'),
        });
        expect(api).not.toHaveBeenCalled();
    });
});

describe('deleteServiceAccount and setServiceAccountEnabled', () => {
    const calls = () => api.mock.calls.map(([{ method, url }]) => `${method} ${url}`);
    const setupLoaded = async (account: ServiceAccount) => {
        api.mockImplementation(async () => ({ ServiceAccounts: [account] }));
        const store = setup();
        await store.dispatch(serviceAccountsThunk());
        api.mockReset();
        return store;
    };

    it.each([
        ['disabling', current, false, ServiceAccountState.Disabled],
        [
            'enabling an account without managers',
            { ...current, Managers: [], State: ServiceAccountState.Disabled },
            true,
            ServiceAccountState.NoManager,
        ],
    ])('shows the new state right away when %s, without refetching', async (_, account, enabled, State) => {
        const store = await setupLoaded(account);
        let resolve: (value: unknown) => void = () => {};
        api.mockImplementation(() => new Promise((r) => (resolve = r)));
        const toggle = store.dispatch(setServiceAccountEnabled({ account, enabled }));
        await Promise.resolve();
        expect(store.getState().serviceAccounts.value).toEqual([{ ...account, State }]);
        resolve({});
        await toggle;
        expect(calls()).toEqual([`put core/v4/members/service-member/${enabled ? 'enable' : 'disable'}`]);
    });

    it('refetches when enabling an account with managers, since token validity is only known to the server', async () => {
        const disabled = { ...current, State: ServiceAccountState.Disabled };
        const store = await setupLoaded(disabled);
        api.mockImplementation(async ({ method }) => (method === 'get' ? { ServiceAccounts: [current] } : {}));
        await store.dispatch(setServiceAccountEnabled({ account: disabled, enabled: true }));
        expect(calls()).toEqual(['put core/v4/members/service-member/enable', 'get account/v1/service-accounts']);
        expect(store.getState().serviceAccounts.value).toEqual([current]);
    });

    it('only changes the state, so a newer list is not overwritten by the copy the prompt opened with', async () => {
        const renamed = { ...current, Name: 'renamed-by-another-admin' };
        const store = await setupLoaded(renamed);
        api.mockResolvedValue({});
        await store.dispatch(setServiceAccountEnabled({ account: current, enabled: false }));
        expect(store.getState().serviceAccounts.value).toEqual([{ ...renamed, State: ServiceAccountState.Disabled }]);
    });

    it('does not bring back an account that was deleted while the prompt was open', async () => {
        const store = await setupLoaded(current);
        store.dispatch(removeServiceAccount(current));
        api.mockRejectedValueOnce(new Error('Service account does not exist'));
        await expect(store.dispatch(setServiceAccountEnabled({ account: current, enabled: false }))).rejects.toThrow(
            'does not exist'
        );
        expect(store.getState().serviceAccounts.value).toEqual([]);
    });

    it('restores the previous state when the update fails', async () => {
        const store = await setupLoaded(current);
        api.mockRejectedValueOnce(new Error('offline'));
        await expect(store.dispatch(setServiceAccountEnabled({ account: current, enabled: false }))).rejects.toThrow(
            'offline'
        );
        expect(store.getState().serviceAccounts.value).toEqual([current]);
    });

    it('removes the account from the list before the request completes, without refetching', async () => {
        const store = setup();
        await store.dispatch(serviceAccountsThunk());
        api.mockClear();
        let resolveDelete: (value: unknown) => void = () => {};
        api.mockImplementation(() => new Promise((resolve) => (resolveDelete = resolve)));
        const deletion = store.dispatch(deleteServiceAccount({ account: current }));
        await Promise.resolve();
        expect(store.getState().serviceAccounts.value).toEqual([]);
        resolveDelete({});
        await deletion;
        expect(api.mock.calls.map(([{ method, url }]) => `${method} ${url}`)).toEqual([
            'delete account/v1/service-accounts/service-member',
        ]);
    });

    it('restores the account when the deletion fails', async () => {
        const store = setup();
        await store.dispatch(serviceAccountsThunk());
        api.mockRejectedValueOnce(new Error('offline'));
        await expect(store.dispatch(deleteServiceAccount({ account: current }))).rejects.toThrow('offline');
        expect(store.getState().serviceAccounts.value).toEqual([current]);
    });

    it('reports success when only the refresh after a change fails', async () => {
        api.mockImplementation(async ({ method }) => {
            if (method === 'get') {
                throw new Error('offline');
            }
            return {};
        });
        await expect(
            setup().dispatch(setServiceAccountEnabled({ account: current, enabled: true }))
        ).resolves.toBeUndefined();
    });

    it.each([
        ['delete', () => deleteServiceAccount({ account: current }), 'account.service_account.delete'],
        ['disable', () => setServiceAccountEnabled({ account: current, enabled: false }), 'account.user.update'],
    ])('rejects %s without permission', async (_, action, permission) => {
        permissions[permission] = false;
        await expect(setup().dispatch(action())).rejects.toThrow('permission');
        expect(api).not.toHaveBeenCalled();
    });
});
