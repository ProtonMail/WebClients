import { useCallback } from 'react';

import { WasmTxBuilder } from '@proton/andromeda';

import { TxBuilderUpdater } from './useTxBuilder';

export type RecipientUpdate = Partial<{ amount: number; address: string }>;

export const useRecipients = (updateTxBuilder: (updater: TxBuilderUpdater) => void) => {
    const addRecipient = useCallback(async () => {
        await updateTxBuilder((txBuilder: WasmTxBuilder) => txBuilder.addRecipient());
    }, [updateTxBuilder]);

    const removeRecipient = useCallback(
        async (index: number) => {
            await updateTxBuilder((txBuilder) => txBuilder.removeRecipient(index));
        },
        [updateTxBuilder]
    );

    const updateRecipient = useCallback(
        async (index: number, update: RecipientUpdate) => {
            await updateTxBuilder((txBuilder) => {
                return txBuilder.updateRecipient(
                    index,
                    update.address,
                    update.amount ? BigInt(update.amount) : undefined
                );
            });
        },
        [updateTxBuilder]
    );

    const updateRecipientAmountToMax = useCallback(
        async (index: number) => {
            await updateTxBuilder((txBuilder) => {
                return txBuilder.updateRecipientAmountToMax(index);
            });
        },
        [updateTxBuilder]
    );

    return { addRecipient, removeRecipient, updateRecipient, updateRecipientAmountToMax };
};
