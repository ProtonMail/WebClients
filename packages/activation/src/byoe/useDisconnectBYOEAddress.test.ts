import { act, renderHook } from '@testing-library/react';
import { type Mock, vi } from 'vitest';

import { buildAddress } from '@proton/account/testing/buildAddress';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

import { loadSyncList } from '../logic/sync/sync.actions';
import { updateBYOEAddressConnection } from '../thunks/updateBYOEAddressConnection';
import { useDisconnectBYOEAddress } from './useDisconnectBYOEAddress';

vi.mock('@proton/account/addresses/hooks', () => ({ useAddresses: vi.fn(() => [[]]) }));
vi.mock('@proton/account/user/hooks', () => ({ useUser: vi.fn(() => [{}]) }));

const mockEntitlements = vi.fn();
vi.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: () => mockEntitlements(),
}));

const mockDispatch = vi.fn();
vi.mock('@proton/redux-shared-store/sharedProvider', () => ({ useDispatch: () => mockDispatch }));

const mockEasySwitchDispatch = vi.fn();
vi.mock('../logic/store', () => ({ useEasySwitchDispatch: () => mockEasySwitchDispatch }));

vi.mock('../logic/sync/sync.actions', () => ({ loadSyncList: vi.fn(() => 'loadSyncList') }));
vi.mock('../thunks/updateBYOEAddressConnection', () => ({
    updateBYOEAddressConnection: vi.fn((args) => ({ thunk: args })),
}));
vi.mock('@proton/telemetry-tracker/lib/tracker', () => ({
    tracker: { emit: vi.fn() },
}));

vi.mock('@proton/shared/lib/helpers/address', () => ({ getIsBYOEOnlyAccount: vi.fn() }));
vi.mock('@proton/shared/lib/user/helpers', () => ({ isAdmin: vi.fn() }));

const mockGetIsBYOEOnlyAccount = getIsBYOEOnlyAccount as Mock;
const mockIsAdmin = isAdmin as Mock;

const address = buildAddress({ ID: 'address-id', Email: 'jane@gmail.com' });

const setup = ({
    isBYOEOnlyAccount = false,
    isMultiUser = false,
    isUserAdmin = true,
    loadingEntitlements = false,
} = {}) => {
    mockGetIsBYOEOnlyAccount.mockReturnValue(isBYOEOnlyAccount);
    mockIsAdmin.mockReturnValue(isUserAdmin);
    mockEntitlements.mockReturnValue([{ isMultiUser }, loadingEntitlements]);
    return renderHook(() => useDisconnectBYOEAddress(address));
};

describe('useDisconnectBYOEAddress', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDispatch.mockResolvedValue(undefined);
    });

    describe('skipDisable', () => {
        it('is false for an admin or single user with other addresses', () => {
            expect(setup().result.current.skipDisable).toBe(false);
        });

        it('is true when the account only has a BYOE address', () => {
            expect(setup({ isBYOEOnlyAccount: true }).result.current.skipDisable).toBe(true);
        });

        it('is true for a non-admin member of an organisation', () => {
            expect(setup({ isMultiUser: true, isUserAdmin: false }).result.current.skipDisable).toBe(true);
        });

        it('is false for an admin of an organisation', () => {
            expect(setup({ isMultiUser: true, isUserAdmin: true }).result.current.skipDisable).toBe(false);
        });

        it('is false for a non-admin who is not in an organisation', () => {
            expect(setup({ isMultiUser: false, isUserAdmin: false }).result.current.skipDisable).toBe(false);
        });
    });

    describe('disconnect', () => {
        it.each([false, true])('dispatches the disconnect thunk with skipDisable=%s', async (isBYOEOnlyAccount) => {
            const { result } = setup({ isBYOEOnlyAccount });

            await act(() => result.current.disconnect());

            expect(updateBYOEAddressConnection).toHaveBeenCalledWith({
                address,
                type: 'disconnect',
                skipDisable: isBYOEOnlyAccount,
            });
            expect(mockDispatch).toHaveBeenCalledTimes(1);
        });

        it('reloads the sync list and emits telemetry on success', async () => {
            const { result } = setup();

            await act(() => result.current.disconnect());

            expect(loadSyncList).toHaveBeenCalledTimes(1);
            expect(mockEasySwitchDispatch).toHaveBeenCalledWith('loadSyncList');
        });

        it('does not reload syncs or emit telemetry when the thunk fails', async () => {
            mockDispatch.mockRejectedValue(new Error('nope'));
            const { result } = setup();

            await act(async () => {
                await result.current.disconnect().catch(() => undefined);
            });

            expect(mockEasySwitchDispatch).not.toHaveBeenCalled();
            expect(tracker.emit).not.toHaveBeenCalled();
        });
    });

    describe('disconnect before the entitlements are loaded', () => {
        it('rejects without dispatching anything', async () => {
            const { result } = setup({ loadingEntitlements: true });

            await expect(result.current.disconnect()).rejects.toThrow();

            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockEasySwitchDispatch).not.toHaveBeenCalled();
            expect(tracker.emit).not.toHaveBeenCalled();
        });
    });

    describe('loading', () => {
        it('only sets isDisconnecting while the request runs', async () => {
            let resolve!: () => void;
            mockDispatch.mockReturnValue(new Promise<void>((r) => (resolve = r)));
            const { result } = setup();

            expect(result.current.isDisconnecting).toBe(false);

            let promise!: Promise<unknown>;
            act(() => {
                promise = result.current.disconnect();
            });
            expect(result.current.isDisconnecting).toBe(true);
            expect(result.current.loading).toBe(true);

            await act(async () => {
                resolve();
                await promise;
            });
            expect(result.current.isDisconnecting).toBe(false);
        });

        it('reports loading, but not isDisconnecting, while entitlements load', () => {
            const { result } = setup({ loadingEntitlements: true });

            expect(result.current.loading).toBe(true);
            expect(result.current.isDisconnecting).toBe(false);
        });
    });
});
