import type { PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-hooks';
import type { MockedFunction } from 'vitest';

import type { WasmBitcoinAddressClient } from '@proton/andromeda';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getMockedApi } from '@proton/wallet/tests';

import { extendStore, setupStore } from '../store';
import { useGetBitcoinAddressHighestIndex } from './useBitcoinAddressHighestIndex';

describe('useBitcoinAddressHighestIndex', () => {
    let mockedGetBitcoinAddressHighestIndex: MockedFunction<WasmBitcoinAddressClient['getBitcoinAddressHighestIndex']>;

    describe('useGetBitcoinAddressHighestIndex', () => {
        beforeEach(() => {
            mockedGetBitcoinAddressHighestIndex = vi
                .fn()
                .mockResolvedValueOnce(BigInt(3))
                .mockResolvedValueOnce(BigInt(16))
                .mockResolvedValueOnce(BigInt(3))
                .mockResolvedValueOnce(BigInt(16));

            extendStore({
                walletApi: getMockedApi({
                    bitcoin_address: {
                        getBitcoinAddressHighestIndex: mockedGetBitcoinAddressHighestIndex,
                    },
                }),
            });
        });

        it('should not cache result for each account', async () => {
            const store = setupStore();

            function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
                return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
            }

            const { result } = renderHook(() => useGetBitcoinAddressHighestIndex(), {
                wrapper: Wrapper,
            });

            expect(await result.current('01', '001')).toBe(3);
            expect(mockedGetBitcoinAddressHighestIndex).toHaveBeenCalledTimes(1);
            expect(mockedGetBitcoinAddressHighestIndex).toHaveBeenCalledWith('01', '001');

            expect(await result.current('01', '002')).toBe(16);
            expect(mockedGetBitcoinAddressHighestIndex).toHaveBeenCalledTimes(2);
            expect(mockedGetBitcoinAddressHighestIndex).toHaveBeenCalledWith('01', '002');

            // should not makes call again
            mockedGetBitcoinAddressHighestIndex.mockClear();

            expect(await result.current('01', '001')).toBe(3);
            expect(mockedGetBitcoinAddressHighestIndex).toHaveBeenCalledTimes(1);
            expect(mockedGetBitcoinAddressHighestIndex).toHaveBeenCalledWith('01', '001');

            expect(await result.current('01', '002')).toBe(16);
            expect(mockedGetBitcoinAddressHighestIndex).toHaveBeenCalledTimes(2);
            expect(mockedGetBitcoinAddressHighestIndex).toHaveBeenCalledWith('01', '002');
        });
    });
});
