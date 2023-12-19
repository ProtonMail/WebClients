import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import Icon from '@proton/components/components/icon/Icon';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';

import { WasmCoinSelection, WasmTxBuilder } from '../../../../pkg';
import { AccountWithBlockchainData } from '../../../types';
import { ManualCoinSelectionModal } from './ManualCoinSelectionModal';
import { useOnchainTransactionAdvancedOptions } from './useOnchainTransactionAdvancedOptions';

interface Props {
    account?: AccountWithBlockchainData;
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: (txBuilder: WasmTxBuilder) => WasmTxBuilder) => void;
}

export const OnchainTransactionAdvancedOptions = ({ account, txBuilder, updateTxBuilder }: Props) => {
    const {
        coinSelectionOptions,
        isManualCoinSelectionModalOpen,
        openManualCoinSelectionModal,
        closeManualCoinSelectionModal,
        handleCoinSelectionOptionSelect,
        handleManualCoinSelection,
        toggleEnableRBF,
        useLocktime,
        toggleUseLocktime,
        handleLocktimeValueChange,
        changePolicyOptions,
        handleChangePolicySelect,
    } = useOnchainTransactionAdvancedOptions(updateTxBuilder);

    const nbUtxosToSpend = txBuilder.get_utxos_to_spend().length;

    return (
        <>
            <div className="flex flex-column flex-1 overflow-y-auto">
                <Collapsible>
                    <CollapsibleHeader
                        suffix={
                            <CollapsibleHeaderIconButton>
                                <Icon name="chevron-down" />
                            </CollapsibleHeaderIconButton>
                        }
                    >
                        <div className="flex flex-row">
                            <h3 className="text-rg text-semibold flex-1">{c('Wallet Send').t`Advanced options`}</h3>
                        </div>
                    </CollapsibleHeader>
                    <CollapsibleContent className="pl-1">
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
                                            selected={txBuilder.get_coin_selection() === option.value}
                                            onClick={() => handleCoinSelectionOptionSelect(option.value)}
                                        >
                                            {option.label}
                                        </Button>
                                    );
                                })}
                            </ButtonGroup>
                            {txBuilder.get_coin_selection() === WasmCoinSelection.Manual && (
                                <Button
                                    shape="underline"
                                    onClick={openManualCoinSelectionModal}
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
                            <Toggle
                                id="enable-rbf"
                                checked={txBuilder.get_rbf_enabled()}
                                onClick={() => toggleEnableRBF()}
                            />
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
                                    // value={txBuilder.get_locktime() ?? 0} TODO: fix this
                                    onChange={handleLocktimeValueChange}
                                    // TODO: add max?
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
                                    value={txBuilder.get_change_policy()}
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
                    </CollapsibleContent>
                </Collapsible>
            </div>

            <ManualCoinSelectionModal
                account={account}
                isOpen={isManualCoinSelectionModalOpen}
                selectedUtxos={txBuilder.get_utxos_to_spend()}
                onClose={closeManualCoinSelectionModal}
                onCoinSelected={handleManualCoinSelection}
            />
        </>
    );
};
