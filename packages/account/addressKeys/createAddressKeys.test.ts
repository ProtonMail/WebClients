import { expect } from '@jest/globals';
import { combineReducers } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { MEMBER_PRIVATE, USER_ROLES } from '@proton/shared/lib/constants';
import type { Address, CachedOrganizationKey, Member, UserModel, UserSettings } from '@proton/shared/lib/interfaces';
import { missingKeysMemberProcess, missingKeysSelfProcess, setupMemberKeys } from '@proton/shared/lib/keys';
import { validateOrganizationKey } from '@proton/shared/lib/organization/helper';

import { addressesReducer } from '../addresses';
import { inactiveKeysReducer } from '../inactiveKeys';
import { ktSlice } from '../kt';
import { memberReducer } from '../member';
import { membersReducer } from '../members';
import { organizationReducer } from '../organization';
import { organizationKeyReducer } from '../organizationKey';
import { getModelState } from '../tests';
import { userReducer } from '../user';
import { userKeysReducer } from '../userKeys';
import { userPermissionsReducer } from '../userPermissions';
import { userSettingsReducer } from '../userSettings';
import { createAddressKeysThunk, getCreateAddressKeysPayload } from './createAddressKeys';
import { addressKeysReducer } from './index';

// The heavy crypto/network processes are the leaves we assert against - the thunk's job is to pick
// the right one based on the user/member/organization-key state, not to actually generate keys.
jest.mock('@proton/shared/lib/keys', () => {
    const { MEMBER_PRIVATE: MOCK_MEMBER_PRIVATE } = require('@proton/shared/lib/constants');

    // Mirrors packages/shared/lib/keys/memberKeys.ts so the real branching logic is exercised
    // without pulling in the crypto import chain.
    const getCanGenerateMemberKeys = (member: any) => {
        const isReadable = member?.Private === MOCK_MEMBER_PRIVATE.READABLE;
        return isReadable && (!member.SSO || (member.SSO && member.Keys.length > 0));
    };
    const getShouldSetupMemberKeys = (member: any) => {
        return !member?.Self && member?.Keys.length === 0 && getCanGenerateMemberKeys(member) && !member.SSO;
    };

    return {
        getCanGenerateMemberKeys,
        getShouldSetupMemberKeys,
        missingKeysSelfProcess: jest.fn(async () => []),
        missingKeysMemberProcess: jest.fn(async () => []),
        setupMemberKeys: jest.fn(async () => ({})),
    };
});

jest.mock('@proton/shared/lib/organization/helper', () => {
    return {
        getOrganizationKeyInfo: jest.fn(() => ({})),
        validateOrganizationKey: jest.fn(() => undefined),
    };
});

jest.mock('@proton/key-transparency/helpers', () => {
    return {
        createKTVerifier: jest.fn(() => ({
            keyTransparencyVerify: jest.fn(async () => {}),
            keyTransparencyCommit: jest.fn(async () => {}),
        })),
    };
});

jest.mock('@proton/account/members', () => {
    const actual = jest.requireActual('@proton/account/members');
    return {
        ...actual,
        // The member-address fetch hits the network; the thunk only cares that it resolves.
        getMemberAddresses: jest.fn(() => async () => []),
        upsertMember: jest.fn(() => ({ type: 'test/upsert-member' })),
    };
});

jest.mock('@proton/account/members/getMember', () => {
    return {
        getMember: jest.fn(async () => ({ ID: 'member-id' })),
    };
});

const mockedMissingKeysSelfProcess = missingKeysSelfProcess as jest.MockedFunction<any>;
const mockedMissingKeysMemberProcess = missingKeysMemberProcess as jest.MockedFunction<any>;
const mockedSetupMemberKeys = setupMemberKeys as jest.MockedFunction<any>;
const mockedValidateOrganizationKey = validateOrganizationKey as jest.MockedFunction<any>;

const reducer = combineReducers({
    ...userReducer,
    ...userKeysReducer,
    ...addressesReducer,
    ...addressKeysReducer,
    ...organizationReducer,
    ...organizationKeyReducer,
    ...memberReducer,
    ...membersReducer,
    ...userPermissionsReducer,
    ...userSettingsReducer,
    inactiveKeys: inactiveKeysReducer,
    kt: ktSlice.reducer,
});

const addressesToGenerate = [{ ID: 'address-1' }] as Address[];

const getUser = ({ Private, isAdmin }: { Private: MEMBER_PRIVATE; isAdmin: boolean }): UserModel =>
    ({
        ID: 'user-id',
        Private,
        isAdmin,
        isSelf: true,
        Role: isAdmin ? USER_ROLES.ADMIN_ROLE : USER_ROLES.MEMBER_ROLE,
        Keys: [{ ID: 'user-key-id', PrivateKey: 'private-key' }],
    }) as UserModel;

const organizationKeyWithAccess = { privateKey: {}, publicKey: {}, Key: {} } as unknown as CachedOrganizationKey;
const organizationKeyWithoutAccess = { Key: {} } as unknown as CachedOrganizationKey;

const selfMember = { ID: 'self-member-id', Self: 1, Private: MEMBER_PRIVATE.READABLE, Keys: [] } as unknown as Member;
const targetMember = {
    ID: 'target-member-id',
    Self: 0,
    Private: MEMBER_PRIVATE.READABLE,
    Keys: [],
    SSO: 0,
} as unknown as Member;
// A member that has already been set up, so keys are generated for the new address rather than
// the member being bootstrapped from scratch.
const targetMemberWithKeys = {
    ...targetMember,
    ID: 'target-member-with-keys-id',
    Keys: [{ ID: 'member-key-id' }],
} as unknown as Member;
const privateTargetMember = {
    ...targetMember,
    ID: 'private-target-member-id',
    Private: MEMBER_PRIVATE.UNREADABLE,
} as unknown as Member;
const ssoTargetMemberWithKeys = {
    ...targetMemberWithKeys,
    ID: 'sso-target-member-with-keys-id',
    SSO: 1,
} as unknown as Member;
const ssoTargetMemberWithoutKeys = { ...targetMember, ID: 'sso-target-member-id', SSO: 1 } as unknown as Member;

const userSettings = { Flags: { SupportPgpV6Keys: 0 } } as unknown as UserSettings;

const setup = ({
    user,
    organizationKey,
    member = selfMember,
}: {
    user: UserModel;
    organizationKey?: CachedOrganizationKey;
    member?: Member;
}) => {
    const api = jest.fn(async () => ({ Addresses: [], Total: 0 }));

    const extraThunkArguments = {
        api,
        authentication: {
            getPassword: () => 'user-keypassword',
        },
        config: { APP_NAME: 'proton-account' },
    } as unknown as ProtonThunkArguments;

    const { store } = getTestStore({
        reducer,
        preloadedState: {
            user: getModelState(user),
            userKeys: getModelState([{ ID: 'user-key-id' }] as any),
            addresses: getModelState([] as Address[]),
            organization: { ...getModelState({} as any), meta: { fetchedAt: Date.now(), type: 1 } } as any,
            organizationKey: getModelState(organizationKey as CachedOrganizationKey),
            member: getModelState(member),
            userSettings: getModelState(userSettings),
        },
        extraThunkArguments,
    });

    return { store, api };
};

const dispatchCreate = async (
    store: ReturnType<typeof setup>['store'],
    options?: { member?: Member; password?: string }
) => {
    const addressKeyCreationPayload = await store.dispatch(getCreateAddressKeysPayload(options));
    await store.dispatch(
        createAddressKeysThunk({
            addressKeyCreationPayload,
            addressesToGenerate,
        })
    );
    return addressKeyCreationPayload;
};

describe('createAddressKeysThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: organization key validation passes; individual tests override when needed.
        mockedValidateOrganizationKey.mockReturnValue(undefined);
    });

    describe('private user, generating for self', () => {
        it('a private user who is not an admin generates their own address keys', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: false }),
            });

            const payload = await dispatchCreate(store);

            expect(payload.type).toBe('user');
            expect(mockedMissingKeysSelfProcess).toHaveBeenCalledTimes(1);
            expect(mockedMissingKeysMemberProcess).not.toHaveBeenCalled();
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
        });

        it('a private user who is an admin without access to the organization key still uses the self process', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: true }),
                organizationKey: organizationKeyWithoutAccess,
            });

            const payload = await dispatchCreate(store);

            // Private self generation never touches the organization key.
            expect(payload.type).toBe('user');
            expect(mockedMissingKeysSelfProcess).toHaveBeenCalledTimes(1);
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
        });

        it('a private user who is an admin with access to the organization key still uses the self process', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: true }),
                organizationKey: organizationKeyWithAccess,
            });

            const payload = await dispatchCreate(store);

            expect(payload.type).toBe('user');
            expect(mockedMissingKeysSelfProcess).toHaveBeenCalledTimes(1);
            expect(mockedMissingKeysMemberProcess).not.toHaveBeenCalled();
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
        });
    });

    describe('non-private user, generating for self', () => {
        it('a non-private user who is an admin with access to the organization key generates via the member process', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.READABLE, isAdmin: true }),
                organizationKey: organizationKeyWithAccess,
            });

            const payload = await dispatchCreate(store);

            // A non-private self user resolves to their own member and generates keys with the org key.
            expect(payload.type).toBe('non-private-member');
            expect(mockedMissingKeysMemberProcess).toHaveBeenCalledTimes(1);
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
            expect(mockedMissingKeysSelfProcess).not.toHaveBeenCalled();
        });

        it('a non-private user who is not an admin cannot generate without an organization key', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.READABLE, isAdmin: false }),
                organizationKey: undefined,
            });

            await expect(store.dispatch(getCreateAddressKeysPayload())).rejects.toThrow(
                'Organization key is not decrypted'
            );

            expect(mockedMissingKeysMemberProcess).not.toHaveBeenCalled();
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
        });

        it('a non-private user who is an admin without access to the organization key cannot generate', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.READABLE, isAdmin: true }),
                organizationKey: organizationKeyWithoutAccess,
            });

            await expect(store.dispatch(getCreateAddressKeysPayload())).rejects.toThrow(
                'Organization key is not decrypted'
            );

            expect(mockedMissingKeysMemberProcess).not.toHaveBeenCalled();
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
        });
    });

    describe('generating for a member', () => {
        it('a private user who is an admin with access to the organization key sets up keys for a member', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: true }),
                organizationKey: organizationKeyWithAccess,
            });

            const payload = await dispatchCreate(store, { member: targetMember, password: 'member-password' });

            expect(payload.type).toBe('non-private-member');
            expect(mockedSetupMemberKeys).toHaveBeenCalledTimes(1);
            expect(mockedMissingKeysSelfProcess).not.toHaveBeenCalled();
        });

        it('a non-private user who is an admin with access to the organization key sets up keys for a member', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.READABLE, isAdmin: true }),
                organizationKey: organizationKeyWithAccess,
            });

            const payload = await dispatchCreate(store, { member: targetMember, password: 'member-password' });

            expect(payload.type).toBe('non-private-member');
            expect(mockedSetupMemberKeys).toHaveBeenCalledTimes(1);
            expect(mockedMissingKeysSelfProcess).not.toHaveBeenCalled();
        });

        it('the member that was passed in is used instead of the one in the store', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: true }),
                organizationKey: organizationKeyWithAccess,
                // The store holds a different member, which must be ignored when one is passed explicitly.
                member: selfMember,
            });

            const payload = await dispatchCreate(store, { member: targetMember, password: 'member-password' });

            expect(payload).toMatchObject({
                type: 'non-private-member',
                payload: { member: { ID: 'target-member-id' }, shouldSetupMemberKeys: true },
            });
            expect(mockedSetupMemberKeys).toHaveBeenCalledWith(
                expect.objectContaining({ member: targetMember, password: 'member-password' })
            );
        });

        it('a member that already has keys generates address keys instead of being set up', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: true }),
                organizationKey: organizationKeyWithAccess,
            });

            // No password is needed - the member is already bootstrapped, so this is only a key generation.
            const payload = await dispatchCreate(store, { member: targetMemberWithKeys });

            expect(payload).toMatchObject({
                type: 'non-private-member',
                payload: { shouldSetupMemberKeys: false },
            });
            expect(mockedMissingKeysMemberProcess).toHaveBeenCalledTimes(1);
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
            expect(mockedMissingKeysSelfProcess).not.toHaveBeenCalled();
        });

        it('a private member is left alone because the admin cannot generate keys for them', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: true }),
                organizationKey: organizationKeyWithAccess,
            });

            const payload = await dispatchCreate(store, { member: privateTargetMember });

            // A private member sets up their own keys on next login, so the thunk is a no-op.
            expect(payload).toMatchObject({ type: 'private-member', payload: { member: privateTargetMember } });
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
            expect(mockedMissingKeysMemberProcess).not.toHaveBeenCalled();
            expect(mockedMissingKeysSelfProcess).not.toHaveBeenCalled();
        });

        it('setting up a member without a password is rejected', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: true }),
                organizationKey: organizationKeyWithAccess,
            });

            await expect(store.dispatch(getCreateAddressKeysPayload({ member: targetMember }))).rejects.toThrow(
                'Member password required when setting up keys'
            );

            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
            expect(mockedMissingKeysMemberProcess).not.toHaveBeenCalled();
        });

        it('generating for a member without a decrypted organization key is rejected', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: true }),
                organizationKey: organizationKeyWithoutAccess,
            });

            await expect(
                store.dispatch(getCreateAddressKeysPayload({ member: targetMember, password: 'member-password' }))
            ).rejects.toThrow('Organization key is not decrypted');

            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
            expect(mockedMissingKeysMemberProcess).not.toHaveBeenCalled();
        });

        it('an SSO member that already has keys generates address keys but is never set up', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: true }),
                organizationKey: organizationKeyWithAccess,
            });

            const payload = await dispatchCreate(store, { member: ssoTargetMemberWithKeys });

            // SSO members set up their keys through the backup password screen, never here.
            expect(payload).toMatchObject({
                type: 'non-private-member',
                payload: { shouldSetupMemberKeys: false },
            });
            expect(mockedMissingKeysMemberProcess).toHaveBeenCalledTimes(1);
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
        });

        it('an SSO member without keys does not require an organization key to build a payload', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: true }),
                organizationKey: organizationKeyWithoutAccess,
            });

            // getCanGenerateMemberKeys is false for a keyless SSO member, so the organization key guard
            // is skipped. The payload builder does not itself refuse the member - callers such as
            // AddressModal gate on getCanGenerateMemberKeys before getting here.
            const payload = await store.dispatch(getCreateAddressKeysPayload({ member: ssoTargetMemberWithoutKeys }));

            expect(payload).toMatchObject({
                type: 'non-private-member',
                payload: { shouldSetupMemberKeys: false },
            });
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
        });
    });

    describe('passing the self member explicitly', () => {
        it('a private user passing their own member generates their own address keys', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.UNREADABLE, isAdmin: true }),
                organizationKey: organizationKeyWithAccess,
            });

            // Passing the self member is equivalent to passing nothing for a private user.
            const payload = await dispatchCreate(store, { member: selfMember });

            expect(payload.type).toBe('user');
            expect(mockedMissingKeysSelfProcess).toHaveBeenCalledTimes(1);
            expect(mockedMissingKeysMemberProcess).not.toHaveBeenCalled();
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
        });

        it('a non-private user passing their own member generates via the member process', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.READABLE, isAdmin: true }),
                organizationKey: organizationKeyWithAccess,
            });

            const payload = await dispatchCreate(store, { member: selfMember });

            // Self is never "set up" here even without keys, so no password is required.
            expect(payload).toMatchObject({
                type: 'non-private-member',
                payload: { member: { ID: 'self-member-id' }, shouldSetupMemberKeys: false },
            });
            expect(mockedMissingKeysMemberProcess).toHaveBeenCalledTimes(1);
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
            expect(mockedMissingKeysSelfProcess).not.toHaveBeenCalled();
        });

        it('a non-private user passing their own member cannot generate without a decrypted organization key', async () => {
            const { store } = setup({
                user: getUser({ Private: MEMBER_PRIVATE.READABLE, isAdmin: true }),
                organizationKey: organizationKeyWithoutAccess,
            });

            await expect(store.dispatch(getCreateAddressKeysPayload({ member: selfMember }))).rejects.toThrow(
                'Organization key is not decrypted'
            );

            expect(mockedMissingKeysMemberProcess).not.toHaveBeenCalled();
            expect(mockedSetupMemberKeys).not.toHaveBeenCalled();
        });
    });
});
