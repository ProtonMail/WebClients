import { c, msgid } from 'ttag';

import { WasmCoinSelection, WasmTxBuilder } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button/Button';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';

import { OnChainFeesSelector } from './OnChainFeesSelector';
import { useOnchainTransactionAdvancedOptions } from './useOnchainTransactionAdvancedOptions';

interface Props {
    txBuilder: WasmTxBuilder;
    helpers: Omit<
        ReturnType<typeof useOnchainTransactionAdvancedOptions>,
        'manualCoinSelectionModal' | 'handleManualCoinSelection' | 'openAdvancedOptionsModal'
    >;
}

export const AdvancedOptionsModal = ({ txBuilder, helpers }: Props) => {
    const {
        advancedOptionsModal,
        coinSelectionOptions,
        switchToCoinSelectionModal,
        feesSelectorHelpers,
        switchToFeesSelectionModal,
        handleCoinSelectionOptionSelect,
        toggleEnableRBF,
        useLocktime,
        toggleUseLocktime,
        handleLocktimeValueChange,
        changePolicyOptions,
        handleChangePolicySelect,
    } = helpers;

    const nbUtxosToSpend = txBuilder.getUtxosToSpend().length;

    const title = c('Wallet Send').t`Advanced options`;

    return (
        <ModalTwo {...advancedOptionsModal} title={title} size="large" enableCloseWhenClickOutside>
            <ModalHeader title={title} />

            <ModalContent className="mt-2 pt-2">
                {/* Fees selection */}
                <OnChainFeesSelector
                    feesSelectorHelpers={feesSelectorHelpers}
                    switchToFeesSelectionModal={switchToFeesSelectionModal}
                />

                {/* Coin selection */}
                <div className="flex flex-column items-start">
                    <label htmlFor="enable-rbf" className="text-semibold text-sm mb-1">
                        {c('Wallet Send').t`Coin selection`}
                    </label>
                    <ButtonGroup>
                        {coinSelectionOptions.map((option) => {
                            return (
                                <Button
                                    className="text-sm"
                                    key={option.value}
                                    selected={txBuilder.getCoinSelection() === option.value}
                                    onClick={() => handleCoinSelectionOptionSelect(option.value)}
                                >
                                    {option.label}
                                </Button>
                            );
                        })}
                    </ButtonGroup>
                    {txBuilder.getCoinSelection() === WasmCoinSelection.Manual && (
                        <Button
                            shape="underline"
                            onClick={() => {
                                switchToCoinSelectionModal();
                            }}
                            className="text-sm color-hint mt-2"
                        >
                            {nbUtxosToSpend
                                ? c('Wallet send').ngettext(
                                      msgid`${nbUtxosToSpend} UTXO selected`,
                                      `${nbUtxosToSpend} UTXOs selected`,
                                      nbUtxosToSpend
                                  )
                                : c('Wallet Send').t`No UTXO selected`}
                        </Button>
                    )}
                </div>

                {/* RBF */}
                <div className="mt-4 flex flex-row items-center">
                    <label
                        htmlFor="enable-rbf"
                        className="text-semibold text-sm w-custom"
                        style={{ '--w-custom': '10rem' }}
                    >
                        {c('Wallet Send').t`Enable RBF`}
                    </label>
                    <Toggle id="enable-rbf" checked={txBuilder.getRbfEnabled()} onClick={() => toggleEnableRBF()} />
                </div>

                {/* Locktime */}
                <div className="mt-4 flex flex-row items-center">
                    <label
                        htmlFor="use-locktime "
                        className="text-semibold text-sm w-custom"
                        style={{ '--w-custom': '10rem' }}
                    >
                        {c('Wallet Send').t`Use a locktime`}
                    </label>

                    <div className="w-custom" style={{ '--w-custom': '10rem' }}>
                        <Toggle id="use-locktime" checked={useLocktime} onClick={() => toggleUseLocktime()} />
                    </div>

                    <div className="w-custom" style={{ '--w-custom': '8rem' }}>
                        <InputFieldTwo
                            type="number"
                            disabled={!useLocktime}
                            hint={c('Wallet Advanced Options').t`Block(s)`}
                            value={txBuilder.getLocktime()?.toConsensusU32() ?? 0}
                            onChange={handleLocktimeValueChange}
                        />
                    </div>
                </div>

                {/* Change Policy */}
                <div className="mt-4 flex flex-row items-center">
                    <label
                        htmlFor="change-policy-select"
                        className="text-semibold text-sm w-custom"
                        style={{ '--w-custom': '10rem' }}
                    >
                        {c('Wallet Send').t`Change policy`}
                    </label>

                    <div className="w-custom" style={{ '--w-custom': '16rem' }}>
                        <SelectTwo
                            id="change-policy-select"
                            value={txBuilder.getChangePolicy()}
                            onChange={handleChangePolicySelect}
                        >
                            {changePolicyOptions.map((option) => (
                                <Option key={option.value} title={option.label} value={option.value} />
                            ))}
                        </SelectTwo>
                    </div>
                </div>

                {/* Data */}
                <div className="mt-4 flex flex-row items-center">
                    <label
                        htmlFor="change-policy-select"
                        className="text-semibold text-sm w-custom"
                        style={{ '--w-custom': '10rem' }}
                    >
                        {c('Wallet Send').t`Data`}
                    </label>

                    <div className="w-custom" style={{ '--w-custom': '10rem' }}>
                        <Button disabled size="small" color="norm">{c('Wallet Send').t`Add Data`}</Button>
                    </div>
                    <Button shape="underline" disabled>{c('Wallet Send').t`Show`}</Button>
                </div>
            </ModalContent>

            <ModalFooter>
                <Button className="ml-auto" onClick={advancedOptionsModal.onClose}>{c('Wallet Send').t`Close`}</Button>
            </ModalFooter>
        </ModalTwo>
    );
};
