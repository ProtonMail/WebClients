import { ChangeEvent, useState } from 'react';

import { c } from 'ttag';

import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

import { WasmChangeSpendPolicy, WasmCoinSelection, WasmLockTime, WasmOutPoint, WasmTxBuilder } from '../../../../pkg';

const getCoinSelectionOptions = () => {
    return [
        { label: c('Wallet Send').t`Minimized Fees`, value: WasmCoinSelection.BranchAndBound },
        // { label: c('Wallet Send').t`Maximised Privacy`, value: WasmCoinSelection.BranchAndBound }, // TODO add privacy first algorithm
        { label: c('Wallet Send').t`Largest first`, value: WasmCoinSelection.LargestFirst },
        { label: c('Wallet Send').t`Oldest first`, value: WasmCoinSelection.OldestFirst },
        { label: c('Wallet Send').t`Manual`, value: WasmCoinSelection.Manual },
    ];
};

const getChangePolicyOptions = () => {
    return [
        { label: c('Wallet Send').t`Only use non-change outputs`, value: WasmChangeSpendPolicy.ChangeForbidden },
        { label: c('Wallet Send').t`Use both`, value: WasmChangeSpendPolicy.ChangeAllowed },
        { label: c('Wallet Send').t`Only use change outputs`, value: WasmChangeSpendPolicy.OnlyChange },
    ];
};

export const useOnchainTransactionAdvancedOptions = (
    updateTxBuilder: (updater: (txBuilder: WasmTxBuilder) => WasmTxBuilder) => void
) => {
    const coinSelectionOptions = getCoinSelectionOptions();
    const [isManualCoinSelectionModalOpen, setIsManualCoinSelectionModalOpen] = useState(false);
    const openManualCoinSelectionModal = () => setIsManualCoinSelectionModalOpen(true);
    const closeManualCoinSelectionModal = () => setIsManualCoinSelectionModalOpen(false);

    const handleManualCoinSelection = async (outpoints: WasmOutPoint[]) => {
        updateTxBuilder((txBuilder) => txBuilder.clearUtxosToSpend());
        for (const outpoint of outpoints) {
            await updateTxBuilder((txBuilder) => txBuilder.addUtxoToSpend(outpoint));
        }

        closeManualCoinSelectionModal();
    };

    const toggleEnableRBF = () => {
        updateTxBuilder((txBuilder: WasmTxBuilder) =>
            txBuilder.getRbfEnabled() ? txBuilder.disableRbf() : txBuilder.enableRbf()
        );
    };

    const [useLocktime, setUseLocktime] = useState(false);
    const toggleUseLocktime = () => {
        const newUseLocktime = !useLocktime;
        setUseLocktime(newUseLocktime);
        if (!newUseLocktime) {
            updateTxBuilder((txBuilder) => txBuilder.removeLocktime());
        }
    };

    const handleLocktimeValueChange = (event: ChangeEvent<HTMLInputElement>) => {
        updateTxBuilder((txBuilder) => txBuilder.addLocktime(WasmLockTime.fromHeight(Number(event.target.value))));
    };

    const changePolicyOptions = getChangePolicyOptions();
    const handleChangePolicySelect = (event: SelectChangeEvent<WasmChangeSpendPolicy>) => {
        const selected = changePolicyOptions.find((opt) => opt.value === event.value);
        if (selected) {
            updateTxBuilder((txBuilder) => txBuilder.setChangePolicy(selected.value));
        }
    };

    const handleCoinSelectionOptionSelect = (coinSelection: WasmCoinSelection) => {
        updateTxBuilder((txBuilder) => txBuilder.setCoinSelection(coinSelection));
    };

    return {
        coinSelectionOptions,
        isManualCoinSelectionModalOpen,
        openManualCoinSelectionModal,
        closeManualCoinSelectionModal,

        changePolicyOptions,
        handleChangePolicySelect,

        handleCoinSelectionOptionSelect,
        handleManualCoinSelection,
        toggleEnableRBF,

        useLocktime,
        toggleUseLocktime,
        handleLocktimeValueChange,
    };
};
