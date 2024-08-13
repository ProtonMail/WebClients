import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { noop } from 'lodash';

import { WasmTxBuilder } from '@proton/andromeda';

export type SyncTxBuilderUpdater = (txBuilder: WasmTxBuilder) => WasmTxBuilder;
export type AsyncTxBuilderUpdater = (txBuilder: WasmTxBuilder) => Promise<WasmTxBuilder>;

const initialTxBuilder = new WasmTxBuilder().clearRecipients();

/**
 * Most of TxBuilder setters need to be async because they deal with account data, which might be syncing at time of the update
 * Since react doesn't support async state updates, we have to stack updates and unwrap them
 */
export const useTxBuilder = () => {
    // Used to decoupled updater from state and avoid side effect in useEffects
    const txBuilderRef = useRef<WasmTxBuilder>();
    const [txBuilder, setTxBuilder] = useState(initialTxBuilder);

    const updatersRef = useRef<AsyncTxBuilderUpdater[]>([]);
    const isUpdateRunningRef = useRef(false);

    const pushUpdate = useCallback((updater: AsyncTxBuilderUpdater) => {
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

        // flushSync ensures that asynchronous updates are applied on latest state
        flushSync(noop);
        isUpdateRunningRef.current = true;

        if (txBuilderRef.current) {
            const updated = await unwrapUpdates(txBuilderRef.current);
            setTxBuilder(updated);
        }

        isUpdateRunningRef.current = false;
    }, [unwrapUpdates]);

    const updateTxBuilderAsync = useCallback(
        async (updater: AsyncTxBuilderUpdater) => {
            pushUpdate(updater);
            await tryMakeUpdates();
        },
        [pushUpdate, tryMakeUpdates]
    );

    const updateTxBuilder = useCallback((updater: SyncTxBuilderUpdater) => {
        setTxBuilder((prev) => updater(prev));
    }, []);

    useEffect(() => {
        txBuilderRef.current = txBuilder;
    }, [txBuilder]);

    return { txBuilder, updateTxBuilder, updateTxBuilderAsync };
};

export type TxBuilderHelper = ReturnType<typeof useTxBuilder>;
