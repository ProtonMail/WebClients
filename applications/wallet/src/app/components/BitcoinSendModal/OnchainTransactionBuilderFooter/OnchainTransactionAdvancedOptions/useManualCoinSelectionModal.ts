import { useCallback, useEffect, useState } from 'react';

import { WasmOutPoint } from '@proton/andromeda';

import { AccountWithChainData } from '../../../../types';
import { useAsyncValue } from '../../../../utils/hooks/useAsyncValue';

export const useManualCoinSelectionModal = (
    isOpen: boolean,
    selectedUtxos: WasmOutPoint[],
    onCoinSelected: (utxos: WasmOutPoint[]) => void,
    account?: AccountWithChainData
) => {
    const [tmpSelectedUtxos, setTmpSelectedUtxos] = useState<string[]>([]);
    const [activeUtxo, setActiveUtxo] = useState<string>();

    const toggleUtxoSelection = (outpoint: string) => {
        setTmpSelectedUtxos((prev) => {
            if (prev.includes(outpoint)) {
                return prev.filter((outpointB) => outpointB !== outpoint);
            }

            return [...prev, outpoint];
        });
    };

    const getUtxos = useCallback(async () => {
        const wasmUtxo = await account?.account.getUtxos();
        return wasmUtxo?.[0] ?? [];
    }, [account]);

    const utxos = useAsyncValue(getUtxos(), []);

    const confirmCoinSelection = () => {
        onCoinSelected(
            tmpSelectedUtxos.map((outpoint) => {
                return WasmOutPoint.fromString(outpoint);
            })
        );
    };

    useEffect(() => {
        if (!isOpen) {
            setTmpSelectedUtxos([]);
        } else {
            setTmpSelectedUtxos(selectedUtxos.map((outpoint) => outpoint[0]));
        }

        // We only want to trigger this effect on modal visibility change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    return {
        tmpSelectedUtxos,
        activeUtxo,
        utxos,
        toggleUtxoSelection,
        setActiveUtxo,
        confirmCoinSelection,
    };
};
