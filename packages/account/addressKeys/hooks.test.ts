// @vitest-environment happy-dom

import { renderHook } from '@testing-library/react';

import { useAddressesKeys } from './hooks';
import type { AddressKeysState } from './index';

let mockState: AddressKeysState;
const mockDispatch = vi.fn();

vi.mock('@proton/react-redux-store/ProtonStoreContext', () => ({
    baseUseSelector: (selector: (state: AddressKeysState) => unknown) => selector(mockState),
    baseUseDispatch: () => mockDispatch,
}));

const keyA = { ID: 'key-a' };
const keyB = { ID: 'key-b' };

const setState = ({
    addresses = { value: [{ ID: 'a' }, { ID: 'b' }] },
    addressKeys = {},
}: {
    addresses?: object;
    addressKeys?: object;
}) => {
    mockState = { addresses, addressKeys } as unknown as AddressKeysState;
};

const render = () => {
    const { result } = renderHook(() => useAddressesKeys());
    const [value, loading] = result.current;
    return { value, loading };
};

describe('useAddressesKeys', () => {
    beforeEach(() => {
        mockDispatch.mockClear();
    });

    it('requests the keys of every address', () => {
        setState({});
        render();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('requests keys again when an address is added after mount, and stops loading once it is decrypted', () => {
        setState({ addressKeys: { a: { value: [keyA] }, b: { value: [keyB] } } });
        const { result, rerender } = renderHook(() => useAddressesKeys());
        expect(result.current[1]).toBe(false);

        setState({
            addresses: { value: [{ ID: 'a' }, { ID: 'b' }, { ID: 'c' }] },
            addressKeys: { a: { value: [keyA] }, b: { value: [keyB] } },
        });
        rerender();
        expect(mockDispatch).toHaveBeenCalledTimes(2);
        expect(result.current[1]).toBe(true);

        setState({
            addresses: mockState.addresses,
            addressKeys: { a: { value: [keyA] }, b: { value: [keyB] }, c: { value: [] } },
        });
        rerender();
        expect(result.current[1]).toBe(false);
    });

    it('does not request keys again when the addresses are unchanged', () => {
        setState({});
        const { rerender } = renderHook(() => useAddressesKeys());
        setState({ addresses: mockState.addresses });
        rerender();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('is loading until the addresses are loaded', () => {
        setState({ addresses: {} });

        expect(render()).toEqual({ value: undefined, loading: true });
    });

    it('is loading with no value until an address is decrypted', () => {
        setState({});

        expect(render()).toEqual({ value: undefined, loading: true });
    });

    it('keeps loading after the first address, while still returning its keys', () => {
        setState({ addressKeys: { a: { value: [keyA] } } });

        const { value, loading } = render();
        expect(loading).toBe(true);
        expect(value?.map(({ keys }) => keys)).toEqual([[keyA], []]);
    });

    it('stops loading once every address is decrypted', () => {
        setState({ addressKeys: { a: { value: [keyA] }, b: { value: [keyB] } } });

        const { value, loading } = render();
        expect(loading).toBe(false);
        expect(value?.map(({ keys }) => keys)).toEqual([[keyA], [keyB]]);
    });

    it('counts an address that failed to decrypt as done', () => {
        setState({ addressKeys: { a: { value: [keyA] }, b: { error: new Error('failed') } } });

        const { value, loading } = render();
        expect(loading).toBe(false);
        expect(value?.map(({ keys }) => keys)).toEqual([[keyA], []]);
    });

    it('stops loading if every address failed to decrypt', () => {
        setState({ addressKeys: { a: { error: new Error('failed') }, b: { error: new Error('failed') } } });

        expect(render()).toEqual({ value: undefined, loading: false });
    });

    it('stops loading when there are no addresses', () => {
        setState({ addresses: { value: [] } });

        expect(render()).toEqual({ value: undefined, loading: false });
    });

    it('stops loading if the addresses failed to load', () => {
        setState({ addresses: { error: new Error('failed') } });

        expect(render()).toEqual({ value: undefined, loading: false });
    });
});
