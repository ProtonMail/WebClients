import { useEffect, useMemo, useState } from 'react';

import { keyBy } from 'lodash';

import { WasmOutPoint } from '../../../pkg';
import { AccountWithBlockchainData } from '../../types';

export const useManualCoinSelectionModal = (
    isOpen: boolean,
    selectedUtxos: WasmOutPoint[],
    onCoinSelected: (utxos: WasmOutPoint[]) => void,
    account?: AccountWithBlockchainData
) => {
    const [tmpSelectedUtxos, setTmpSelectedUtxos] = useState<string[]>([]);
    const [activeUtxo, setActiveUtxo] = useState<string>();

    const handleToggleUtxoSelection = (script_pubkey: string) => {
        setTmpSelectedUtxos((prev) => {
            if (prev.includes(script_pubkey)) {
                return prev.filter((spub) => spub !== script_pubkey);
            }

            return [...prev, script_pubkey];
        });
    };

    const utxos = useMemo(() => account?.utxos ?? [], [account]);

    const handleConfirmCoinSelection = () => {
        const utxoByOutpoint = keyBy(utxos, (utxo) => utxo.outpoint[0]);
        onCoinSelected(tmpSelectedUtxos.map((outpoint) => utxoByOutpoint[outpoint].outpoint));
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
        handleToggleUtxoSelection,
        setActiveUtxo,
        handleConfirmCoinSelection,
    };
};
