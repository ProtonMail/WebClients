import { expect } from '@jest/globals';
import type { Action } from '@reduxjs/toolkit';
import { combineReducers, createAction } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import {
    type Address,
    type CachedOrganizationKey,
    type EnhancedGroup,
    GroupFlags,
    KeyTransparencyActivation,
} from '@proton/shared/lib/interfaces';
import { createGroupAddressKey } from '@proton/shared/lib/keys/groupKeys';

import { type GroupsState, groupsReducer, selectGroups } from '../groups';
import { ktSlice } from '../kt';
import { organizationKeyReducer } from '../organizationKey';
import { getModelState } from '../test';
import { groupKeysListener } from './groupKeysListener';

// Lets the redux listener middleware schedule and run any pending effect.
// Used in negative tests to give the effect a fair chance to fire (and fail the assertion) if the predicate was wrong.
const flushAsyncWork = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
};

jest.mock('@proton/shared/lib/keys/groupKeys', () => ({
    createGroupAddressKey: jest.fn(),
}));

jest.mock('@proton/key-transparency/helpers', () => ({
    createKTVerifier: jest.fn(() => ({
        keyTransparencyVerify: jest.fn(),
        keyTransparencyCommit: jest.fn(),
    })),
}));

const mockedCreateGroupAddressKey = createGroupAddressKey as jest.MockedFunction<typeof createGroupAddressKey>;

type GeneratedKey = Awaited<ReturnType<typeof createGroupAddressKey>>[number];

const getGeneratedKey = (id: string): GeneratedKey =>
    ({
        ID: `key-${id}`,
        PrivateKey: `private-${id}`,
        Primary: 1,
        Active: 1,
        Flags: 3,
        Fingerprint: `fp-${id}`,
        Signature: `signature-${id}`,
        AddressForwardingID: null,
        Version: 4,
    }) as unknown as GeneratedKey;

const setStateAction = createAction<{
    groups?: EnhancedGroup[];
    organizationKey?: CachedOrganizationKey;
}>('test/setState');

const baseReducer = combineReducers({
    ...groupsReducer,
    ...organizationKeyReducer,
    kt: ktSlice.reducer,
});

type BaseState = ReturnType<typeof baseReducer>;

const reducer = (state: BaseState | undefined, action: Action): BaseState => {
    if (setStateAction.match(action)) {
        const previous = state ?? baseReducer(undefined, action);
        return {
            ...previous,
            ...(action.payload.groups !== undefined && {
                groups: { ...previous.groups, value: action.payload.groups },
            }),
            ...(action.payload.organizationKey !== undefined && {
                organizationKey: { ...previous.organizationKey, value: action.payload.organizationKey },
            }),
        };
    }
    return baseReducer(state, action);
};

const getAddress = (data: Partial<Address> & { ID: string }): Address =>
    ({
        Email: `${data.ID}@example.com`,
        Keys: [],
        HasKeys: 0,
        ...data,
    }) as Address;

const getGroup = (data: { ID: string; Flags?: GroupFlags; Keys?: Address['Keys']; HasKeys?: number }): EnhancedGroup =>
    ({
        ID: data.ID,
        Name: `group-${data.ID}`,
        Description: '',
        Flags: data.Flags ?? GroupFlags.System,
        Address: getAddress({
            ID: `address-${data.ID}`,
            Keys: data.Keys ?? [],
            HasKeys: data.HasKeys ?? 0,
        }),
    }) as EnhancedGroup;

const getOrganizationKey = (overrides: Partial<CachedOrganizationKey> = {}): CachedOrganizationKey =>
    ({
        Key: {} as any,
        privateKey: {} as any,
        publicKey: {} as any,
        ...overrides,
    }) as CachedOrganizationKey;

const setup = ({
    isFlagEnabled = true,
    preloadedState,
}: {
    isFlagEnabled?: boolean;
    preloadedState?: Partial<BaseState>;
} = {}) => {
    const isEnabled = jest.fn().mockReturnValue(isFlagEnabled);
    const isReady = jest.fn().mockReturnValue(true);
    const getError = jest.fn().mockReturnValue(undefined);
    const api = jest.fn();
    const extraThunkArguments = {
        unleashClient: { isEnabled, isReady, getError },
        api,
        config: {},
        authentication: { getPassword: () => '' },
    } as unknown as ProtonThunkArguments;

    const { store, startListening } = getTestStore({
        reducer,
        preloadedState: {
            groups: getModelState<EnhancedGroup[] | undefined>(undefined),
            organizationKey: getModelState<CachedOrganizationKey | undefined>(undefined),
            kt: { value: KeyTransparencyActivation.DISABLED },
            ...preloadedState,
        } as BaseState,
        extraThunkArguments,
    });

    groupKeysListener(startListening as any);

    return { store, isEnabled };
};

describe('groupKeysListener', () => {
    beforeEach(() => {
        mockedCreateGroupAddressKey.mockReset();
    });

    it('generates keys for groups that need them when the listener fires', async () => {
        mockedCreateGroupAddressKey.mockImplementation(async ({ address }) => [getGeneratedKey(address.ID)]);

        const { store, isEnabled } = setup();

        store.dispatch(
            setStateAction({
                groups: [getGroup({ ID: '1' }), getGroup({ ID: '2' })],
                organizationKey: getOrganizationKey(),
            })
        );

        await waitFor(() => expect(mockedCreateGroupAddressKey).toHaveBeenCalledTimes(2));
        expect(isEnabled).toHaveBeenCalledWith('SystemGroupFlag');

        await waitFor(() => {
            const groups = selectGroups(store.getState() as unknown as GroupsState).value!;
            expect(groups[0].Address.HasKeys).toBe(1);
            expect(groups[0].Address.Keys).toEqual([getGeneratedKey('address-1')]);
            expect(groups[1].Address.HasKeys).toBe(1);
            expect(groups[1].Address.Keys).toEqual([getGeneratedKey('address-2')]);
        });
    });

    it('skips groups that already have keys and non-system groups', async () => {
        mockedCreateGroupAddressKey.mockImplementation(async ({ address }) => [getGeneratedKey(address.ID)]);

        const { store } = setup();
        const alreadyHasKeys = getGroup({ ID: '2', HasKeys: 1 });
        const nonSystem = getGroup({ ID: '3', Flags: GroupFlags.None });

        store.dispatch(
            setStateAction({
                groups: [getGroup({ ID: '1' }), alreadyHasKeys, nonSystem],
                organizationKey: getOrganizationKey(),
            })
        );

        await waitFor(() => expect(mockedCreateGroupAddressKey).toHaveBeenCalledTimes(1));
        expect(mockedCreateGroupAddressKey.mock.calls[0][0].address.ID).toBe('address-1');

        const groups = selectGroups(store.getState() as unknown as GroupsState).value!;
        expect(groups[0].Address.Keys).toEqual([getGeneratedKey('address-1')]);
        // Unchanged groups are left as-is.
        expect(groups[1]).toEqual(alreadyHasKeys);
        expect(groups[2]).toEqual(nonSystem);
    });

    it('runs the effect when groups change and an organizationKey is already loaded', async () => {
        mockedCreateGroupAddressKey.mockImplementation(async ({ address }) => [getGeneratedKey(address.ID)]);
        const { store } = setup({
            preloadedState: {
                organizationKey: getModelState(getOrganizationKey()),
            },
        });

        store.dispatch(setStateAction({ groups: [getGroup({ ID: '1' })] }));

        await waitFor(() => expect(mockedCreateGroupAddressKey).toHaveBeenCalledTimes(1));
    });

    it('runs the effect when organizationKey arrives after groups are already loaded', async () => {
        mockedCreateGroupAddressKey.mockImplementation(async ({ address }) => [getGeneratedKey(address.ID)]);
        const { store } = setup({
            preloadedState: {
                groups: getModelState([getGroup({ ID: '1' })]),
            },
        });

        store.dispatch(setStateAction({ organizationKey: getOrganizationKey() }));

        await waitFor(() => expect(mockedCreateGroupAddressKey).toHaveBeenCalledTimes(1));
    });

    it('does not run the effect when there are no groups', async () => {
        const { store } = setup();

        store.dispatch(
            setStateAction({
                groups: [],
                organizationKey: getOrganizationKey(),
            })
        );

        await flushAsyncWork();
        expect(mockedCreateGroupAddressKey).not.toHaveBeenCalled();
    });

    it('does not run the effect when organizationKey has no privateKey', async () => {
        const { store } = setup();

        store.dispatch(
            setStateAction({
                groups: [getGroup({ ID: '1' })],
                organizationKey: getOrganizationKey({ privateKey: undefined }),
            })
        );

        await flushAsyncWork();
        expect(mockedCreateGroupAddressKey).not.toHaveBeenCalled();
    });

    it('does not run the effect when no group needs key generation', async () => {
        const { store, isEnabled } = setup();

        store.dispatch(
            setStateAction({
                groups: [
                    getGroup({ ID: '1', HasKeys: 1 }), // already has keys
                    getGroup({ ID: '2', Flags: GroupFlags.None }), // not a system group
                ],
                organizationKey: getOrganizationKey(),
            })
        );

        await flushAsyncWork();
        // Predicate returns false before the effect runs, so the feature flag is never consulted.
        expect(isEnabled).not.toHaveBeenCalled();
        expect(mockedCreateGroupAddressKey).not.toHaveBeenCalled();
    });

    it('does not generate keys when the SystemGroupFlag is disabled', async () => {
        const { store, isEnabled } = setup({ isFlagEnabled: false });

        store.dispatch(
            setStateAction({
                groups: [getGroup({ ID: '1' })],
                organizationKey: getOrganizationKey(),
            })
        );

        await waitFor(() => expect(isEnabled).toHaveBeenCalledWith('SystemGroupFlag'));
        expect(mockedCreateGroupAddressKey).not.toHaveBeenCalled();

        const groups = selectGroups(store.getState() as unknown as GroupsState).value!;
        expect(groups[0].Address.HasKeys).toBe(0);
        expect(groups[0].Address.Keys).toEqual([]);
    });

    it('stays unsubscribed while the effect is running, then resubscribes when it completes', async () => {
        // Hang the first call so the listener stays unsubscribed for the middle of the test.
        let resolveFirstCall: ((keys: GeneratedKey[]) => void) | undefined;
        mockedCreateGroupAddressKey.mockImplementationOnce(
            () =>
                new Promise<GeneratedKey[]>((resolve) => {
                    resolveFirstCall = resolve;
                })
        );

        const { store } = setup();

        store.dispatch(
            setStateAction({
                groups: [getGroup({ ID: '1' })],
                organizationKey: getOrganizationKey(),
            })
        );

        await waitFor(() => expect(mockedCreateGroupAddressKey).toHaveBeenCalledTimes(1));

        // A second qualifying transition while the effect is still in-flight must NOT trigger again.
        store.dispatch(
            setStateAction({
                groups: [getGroup({ ID: '1' }), getGroup({ ID: '2' })],
                organizationKey: getOrganizationKey(),
            })
        );

        await flushAsyncWork();
        expect(mockedCreateGroupAddressKey).toHaveBeenCalledTimes(1);

        // Resolve the in-flight call and switch the mock to a sync impl for the next invocation.
        mockedCreateGroupAddressKey.mockImplementation(async ({ address }) => [getGeneratedKey(address.ID)]);
        resolveFirstCall?.([getGeneratedKey('address-1')]);

        // After the effect completes, the listener resubscribes and reacts to a new qualifying transition.
        await flushAsyncWork();
        store.dispatch(
            setStateAction({
                groups: [getGroup({ ID: '3' })],
                organizationKey: getOrganizationKey(),
            })
        );

        await waitFor(() => expect(mockedCreateGroupAddressKey).toHaveBeenCalledTimes(2));
        expect(mockedCreateGroupAddressKey.mock.calls[1][0].address.ID).toBe('address-3');
    });
});
