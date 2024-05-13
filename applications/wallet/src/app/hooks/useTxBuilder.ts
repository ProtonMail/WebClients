import { useCallback, useEffect, useRef, useState } from 'react';

import { WasmTxBuilder } from '@proton/andromeda';

import { AccountWithChainData } from '../types';

export type TxBuilderUpdater = (txBuilder: WasmTxBuilder) => WasmTxBuilder | Promise<WasmTxBuilder>;

/**
 * Most of TxBuilder setters need to be async because they deal with account data, which might be syncing at time of the update
 * Since react doesn't support async state updates, we have to stack updates and unwrap them
 */
export const useTxBuilder = (account: AccountWithChainData) => {
    // Used to decoupled updater from state and avoid side effect in useEffects
    const txBuilderRef = useRef<WasmTxBuilder>();
    const [txBuilder, setTxBuilder] = useState(new WasmTxBuilder(account.account));

    const updatersRef = useRef<TxBuilderUpdater[]>([]);
    const isUpdateRunningRef = useRef(false);

    const pushUpdate = useCallback((updater: TxBuilderUpdater) => {
        updatersRef.current = [...updatersRef.current, updater];
    }, []);

    const unwrapUpdates = useCallback(async (txBuilder: WasmTxBuilder): Promise<WasmTxBuilder> => {
        const [firstUpdate, ...remaining] = updatersRef.current;
        updatersRef.current = remaining;

        const updated = await firstUpdate(txBuilder);

        // new updates can have been pushed since current unwrap start
        const newUpdaters = updatersRef.current;
        return newUpdaters.length ? unwrapUpdates(updated) : updated;
    }, []);

    const tryMakeUpdates = useCallback(async () => {
        if (isUpdateRunningRef.current) {
            return;
        }

        isUpdateRunningRef.current = true;

        if (txBuilderRef.current) {
            const updated = await unwrapUpdates(txBuilderRef.current);
            setTxBuilder(updated);
        }

        isUpdateRunningRef.current = false;
    }, [unwrapUpdates]);

    const updateTxBuilder = useCallback(
        (updater: TxBuilderUpdater) => {
            pushUpdate(updater);
            void tryMakeUpdates();
        },
        [pushUpdate, tryMakeUpdates]
    );

    useEffect(() => {
        txBuilderRef.current = txBuilder;
    }, [txBuilder]);

    return { txBuilder, updateTxBuilder };
};
