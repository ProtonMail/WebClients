import { act, renderHook } from '@testing-library/react';

import { orderAddresses } from '@proton/account/addresses/actions';
import { useAddresses } from '@proton/account/addresses/hooks';
import { buildAddress } from '@proton/account/testing/buildAddress';
import { ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS, ADDRESS_TYPE } from '@proton/shared/lib/constants';

import { useDefaultAddress } from './useDefaultAddress';

const mockDispatch = jest.fn();
jest.mock('@proton/redux-shared-store/sharedProvider', () => ({ useDispatch: () => mockDispatch }));
jest.mock('@proton/account/addresses/hooks', () => ({ useAddresses: jest.fn() }));
jest.mock('@proton/account/addresses/actions', () => ({ orderAddresses: jest.fn((payload) => payload) }));

const enabled = {
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Send: ADDRESS_SEND.SEND_YES,
    Type: ADDRESS_TYPE.TYPE_ORIGINAL,
};
const first = buildAddress({ ...enabled, ID: 'first', Order: 1 });
const second = buildAddress({ ...enabled, ID: 'second', Order: 2 });
const disabled = buildAddress({ ...enabled, ID: 'disabled', Order: 3, Status: ADDRESS_STATUS.STATUS_DISABLED });

describe('useDefaultAddress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Unsorted on purpose: the hook sorts them
        jest.mocked(useAddresses).mockReturnValue([[disabled, second, first], false]);
    });

    it('returns the first sorted address as default and only usable addresses as options', () => {
        const { result } = renderHook(() => useDefaultAddress());

        expect(result.current.defaultAddress).toBe(first);
        expect(result.current.options).toEqual([first, second]);
    });

    it('moves the chosen address first', async () => {
        const { result } = renderHook(() => useDefaultAddress());

        await act(() => result.current.setDefaultAddress('second'));

        expect(orderAddresses).toHaveBeenCalledWith({ member: undefined, addresses: [second, first, disabled] });
        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('does nothing for the current default address', async () => {
        const { result } = renderHook(() => useDefaultAddress());

        await act(() => result.current.setDefaultAddress('first'));

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('never makes a disabled address the default', async () => {
        const { result } = renderHook(() => useDefaultAddress());

        await act(() => result.current.setDefaultAddress('disabled'));

        expect(mockDispatch).not.toHaveBeenCalled();
    });
});
