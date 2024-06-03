import { act, renderHook } from '@testing-library/react-hooks';

import { mockUseBitcoinBlockchainContext } from '../../tests';
import { apiWalletsData } from '../../tests/fixtures/api';
import { mockUseBitcoinAddressHighestIndexModule } from '../../tests/mocks/useGetBitcoinAddressHighestIndex';
import { useBitcoinReceive } from './useBitcoinReceive';

describe('useBitcoinReceive', () => {
    beforeEach(() => {
        mockUseBitcoinBlockchainContext();
        mockUseBitcoinAddressHighestIndexModule();
    });

    describe('handleChangeAmount', () => {
        describe("when amount is below selected wallet's balance", () => {
            it('should constrain it to 0', () => {
                const { result } = renderHook(() => useBitcoinReceive(true, apiWalletsData[0].WalletAccounts[0]));

                act(() => result.current.handleChangeAmount(-12));
                expect(result.current.amount).toBe(0);
            });
        });

        it('should set new amount', () => {
            const { result } = renderHook(() => useBitcoinReceive(true, apiWalletsData[0].WalletAccounts[0]));

            act(() => result.current.handleChangeAmount(124));
            expect(result.current.amount).toBe(124);
        });
    });

    describe('showAmountInput', () => {
        it('should turn `shouldShowAmountInput` to true', () => {
            const { result } = renderHook(() => useBitcoinReceive(true, apiWalletsData[0].WalletAccounts[0]));

            act(() => result.current.showAmountInput());
            expect(result.current.shouldShowAmountInput).toBeTruthy();
        });
    });
});
