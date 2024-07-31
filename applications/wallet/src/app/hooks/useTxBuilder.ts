import { useCallback, useEffect, useRef, useState } from 'react';

import { WasmTxBuilder } from '@proton/andromeda';

export type TxBuilderUpdater = (txBuilder: WasmTxBuilder) => WasmTxBuilder;

/**
 * Most of TxBuilder setters need to be async because they deal with account data, which might be syncing at time of the update
 * Since react doesn't support async state updates, we have to stack updates and unwrap them
 */
export const useTxBuilder = () => {
    // Used to decoupled updater from state and avoid side effect in useEffects
    const txBuilderRef = useRef<WasmTxBuilder>();
    const [txBuilder, setTxBuilder] = useState(new WasmTxBuilder());

    const updateTxBuilder = useCallback((updater: TxBuilderUpdater) => {
        setTxBuilder((prev) => updater(prev));
    }, []);

    useEffect(() => {
        txBuilderRef.current = txBuilder;
    }, [txBuilder]);

    return { txBuilder, updateTxBuilder };
};
