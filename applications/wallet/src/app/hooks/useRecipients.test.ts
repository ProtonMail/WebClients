import { act } from 'react-dom/test-utils';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { WasmBitcoinUnit, WasmTxBuilder } from '../../pkg';
import { useRecipients } from './useRecipients';

describe('useRecipients', async () => {
    const txBuilder = {
        addRecipient: vi.fn(),
        removeRecipient: vi.fn(),
        updateRecipient: vi.fn(),
        updateRecipientAmountToMax: vi.fn(),
    } as unknown as WasmTxBuilder;
    const mockUpdater = vi.fn((update) => update(txBuilder));

    describe('addRecipient', () => {
        it('should call txBuilder addRecipient', async () => {
            const { result } = renderHook(() => useRecipients(mockUpdater));
            await act(() => result.current.addRecipient());

            await waitFor(() => {
                expect(txBuilder.addRecipient).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('removeRecipient', () => {
        it('should call txBuilder removeRecipient with correct args', async () => {
            const { result } = renderHook(() => useRecipients(mockUpdater));

            await act(() => result.current.removeRecipient(3));

            await waitFor(() => {
                expect(txBuilder.removeRecipient).toHaveBeenCalledTimes(1);
            });

            expect(txBuilder.removeRecipient).toHaveBeenCalledWith(3);
        });
    });

    describe('updateRecipient', () => {
        it('should call txBuilder updateRecipient', async () => {
            const { result } = renderHook(() => useRecipients(mockUpdater));
            await act(() => result.current.updateRecipient(3, { amount: 89283 }));

            await waitFor(() => {
                expect(txBuilder.updateRecipient).toHaveBeenCalledTimes(1);
            });

            expect(txBuilder.updateRecipient).toHaveBeenNthCalledWith(1, 3, undefined, 89283, undefined);

            await act(() => result.current.updateRecipient(3, { address: 'tb1...' }));

            await waitFor(() => {
                expect(txBuilder.updateRecipient).toHaveBeenCalledTimes(2);
            });

            expect(txBuilder.updateRecipient).toHaveBeenNthCalledWith(2, 3, 'tb1...', undefined, undefined);

            await act(() => result.current.updateRecipient(3, { unit: WasmBitcoinUnit.MBTC }));

            await waitFor(() => {
                expect(txBuilder.updateRecipient).toHaveBeenCalledTimes(3);
            });

            expect(txBuilder.updateRecipient).toHaveBeenNthCalledWith(3, 3, undefined, undefined, WasmBitcoinUnit.MBTC);
        });

        describe("when recipient doesn't exist at index", () => {
            it('should do nothing', async () => {
                const { result } = renderHook(() => useRecipients(mockUpdater));

                // const before = { ...result.current };
                await act(() =>
                    result.current.updateRecipient(4, { address: 'bc1....helloworld', unit: WasmBitcoinUnit.SAT })
                );

                // FIXME: to replace by spied function on txBuilder when wasm test are fixed
                // expect(result.current.recipients).toStrictEqual(before.recipients);
            });
        });
    });
});
