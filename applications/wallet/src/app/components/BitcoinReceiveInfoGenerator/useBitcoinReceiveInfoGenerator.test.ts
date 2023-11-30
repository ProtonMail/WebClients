import { act, renderHook } from '@testing-library/react-hooks';

import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

import { accounts, wallets } from '../../tests';
import { LightningUriFormat, WalletKind } from '../../types';
import { useBitcoinReceiveInfoGenerator } from './useBitcoinReceiveInfoGenerator';

describe('useBitcoinReceiveInfoGenerator', () => {
    describe('handleSelectWallet', () => {
        it('should set `selectedWallet`', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(wallets, accounts));

            act(() => result.current.handleSelectWallet({ value: '1' } as SelectChangeEvent<string>));
            expect(result.current.selectedWallet).toStrictEqual({
                kind: WalletKind.ONCHAIN,
                name: 'Bitcoin 01',
                id: '1',
                balance: 11783999,
            });
        });
    });

    describe('handleSelectAccount', () => {
        it('should set `selectedAccount`', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(wallets, accounts));

            act(() => result.current.handleSelectAccount({ value: '1' } as SelectChangeEvent<string>));
            expect(result.current.selectedAccount).toStrictEqual({ name: 'account #2', id: '1' });
        });
    });

    describe('handleSelectFormat', () => {
        it('should set `selectedFormat`', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(wallets, accounts));

            act(() =>
                result.current.handleSelectFormat({
                    value: LightningUriFormat.ONCHAIN,
                } as SelectChangeEvent<LightningUriFormat>)
            );
            expect(result.current.selectedFormat).toStrictEqual({ name: 'Onchain', value: LightningUriFormat.ONCHAIN });
        });
    });

    describe('handleChangeAmount', () => {
        describe("when amount is below selected wallet's balance", () => {
            it('should constrain it to 0', () => {
                const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(wallets, accounts));

                act(() => result.current.handleChangeAmount(-12));
                expect(result.current.amount).toBe(0);
            });
        });

        it('should set new amount', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(wallets, accounts));

            act(() => result.current.handleChangeAmount(124));
            expect(result.current.amount).toBe(124);
        });
    });

    describe('showAmountInput', () => {
        it('should turn `shouldShowAmountInput` to true', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(wallets, accounts));

            act(() => result.current.showAmountInput());
            expect(result.current.shouldShowAmountInput).toBeTruthy();
        });
    });

    describe('when `defaultWalletId` is provided', () => {
        it('should select the associated wallet by default', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(wallets, accounts, wallets[3].id));

            expect(result.current.selectedWallet).toStrictEqual(wallets[3]);
        });
    });
});
