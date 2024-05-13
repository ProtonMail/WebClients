import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Mock } from 'vitest';

import {
    WasmAccount,
    WasmDerivationPath,
    WasmNetwork,
    WasmScriptType,
    WasmTxBuilder,
    WasmWallet
} from '@proton/andromeda';

import { getFeesEstimationMap, mockUseBitcoinBlockchainContext } from '../../../../tests';
import { useOnChainFeesSelector } from './useOnChainFeesSelector';

describe('useOnChainFeesSelector', () => {
    let updateTxBuilder: Mock;
    let txBuilder: WasmTxBuilder;

    const wallet = new WasmWallet(
        WasmNetwork.Testnet,
        'category law logic swear involve banner pink room diesel fragile sunset remove whale lounge captain code hobby lesson material current moment funny vast fade'
    );
    const account = new WasmAccount(wallet, WasmScriptType.Taproot, WasmDerivationPath.fromString("m/86'/1'/0'"));

    beforeEach(() => {
        updateTxBuilder = vi.fn().mockImplementation(async (updater) => {
            txBuilder = await updater(txBuilder);
            return txBuilder;
        });

        txBuilder = new WasmTxBuilder(account);

        mockUseBitcoinBlockchainContext({ feesEstimation: getFeesEstimationMap() });
    });

    describe('on mount', () => {
        it('should set default fee to target next 5th block', async () => {
            renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));

            await waitFor(() => {
                expect(txBuilder.getFeeRate()).toBe(BigInt(29));
            });
        });

        it('should keep isRecommended to true', async () => {
            const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));

            expect(result.current.isRecommended).toBeTruthy();
        });
    });

    describe('handleFeesSelected', () => {
        describe('should set fee rate', () => {
            it('use lower block target', async () => {
                const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
                result.current.handleFeesSelected(4);

                await waitFor(() => {
                    expect(txBuilder.getFeeRate()).toBe(BigInt(4));
                });
            });

            it('should turn isRecommended to false by default', () => {
                const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
                result.current.handleFeesSelected(4);
                expect(result.current.isRecommended).toBeFalsy();
            });
        });
    });

    describe('feeRateNote', () => {
        describe('when below 5th next block', () => {
            it('should `HIGH` note', async () => {
                txBuilder = await txBuilder.setFeeRate(BigInt(165));
                const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
                expect(result.current.feeRateNote).toBe('HIGH');
            });
        });

        describe('when below 10th next block', () => {
            it('should `MODERATE` note', async () => {
                txBuilder = await txBuilder.setFeeRate(BigInt(15));
                const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
                expect(result.current.feeRateNote).toBe('MODERATE');
            });
        });

        describe('when above 10th next block', () => {
            it('should `LOW` note', async () => {
                txBuilder = await txBuilder.setFeeRate(BigInt(1));
                const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
                expect(result.current.feeRateNote).toBe('LOW');
            });
        });
    });
});
