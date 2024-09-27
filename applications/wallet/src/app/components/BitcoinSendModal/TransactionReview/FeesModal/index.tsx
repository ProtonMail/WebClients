import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmNetwork } from '@proton/andromeda';
import type { IconName } from '@proton/components';
import { Icon, Tooltip } from '@proton/components';
import type { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import { useUserWalletSettings } from '@proton/wallet/store';

import { Modal } from '../../../../atoms';
import { CoreButton } from '../../../../atoms/Button';
import { Price } from '../../../../atoms/Price';
import type { TxBuilderHelper } from '../../../../hooks/useTxBuilder';
import { secondaryAmount } from '../../AmountInput/BitcoinAmountInputWithBalanceAndCurrencySelect';

import './FeesModal.scss';

interface Props extends ModalOwnProps {
    accountExchangeRate?: WasmApiExchangeRate;
    exchangeRate: WasmApiExchangeRate;
    txBuilderHelpers: TxBuilderHelper;
    network: WasmNetwork;
    getFeesByBlockTarget: (blockTarget: number) => number | undefined;
}

export const FeesModal = ({
    accountExchangeRate,
    exchangeRate,
    txBuilderHelpers,
    getFeesByBlockTarget,
    network,
    ...modalProps
}: Props) => {
    const { txBuilder, updateTxBuilder, updateTxBuilderAsync } = txBuilderHelpers;

    const [settings] = useUserWalletSettings();

    const getFeeOption = useCallback(
        async (icon: IconName, text: string, blockTarget: number): Promise<[IconName, string, number, number]> => {
            const feeRate = getFeesByBlockTarget(blockTarget) ?? blockTarget;
            const draftPsbt = await txBuilder.setFeeRate(BigInt(feeRate)).createDraftPsbt(network);

            return [icon, text, feeRate, Number(draftPsbt.total_fees)];
        },
        [getFeesByBlockTarget, network, txBuilder]
    );

    const [feeOptions, setFeeOptions] = useState<[IconName, string, number, number][]>([]);

    useEffect(() => {
        const options: [IconName, string, number, number][] = [];
        // Fetch with `allSettled` to get fee options even if some of them fail
        Promise.allSettled([
            getFeeOption('chevron-up', c('Wallet send').t`High priority`, 1),
            getFeeOption('minus', c('Wallet send').t`Median priority`, 5),
            getFeeOption('chevron-down', c('Wallet send').t`Low priority`, 10),
        ]).then((results) =>
            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    options.push(result.value);
                }
            })
        );
        setFeeOptions(options);
    }, [getFeeOption]);

    const handleFeesSelection = async (feeRate: number) => {
        updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(feeRate)));
        await updateTxBuilderAsync((txBuilder) => txBuilder.constrainRecipientAmounts());

        modalProps.onClose?.();
    };

    return (
        <Modal
            {...modalProps}
            className="fees-selection-modal"
            size="small"
            header={
                <div className="flex flex-row justify-space-between px-6 items-center my-4">
                    <h1 className="text-lg text-semibold">{c('Wallet send').t`Network fees`}</h1>

                    <Tooltip title={c('Action').t`Close`}>
                        <CoreButton
                            className="shrink-0 rounded-full bg-norm"
                            icon
                            size="small"
                            shape="ghost"
                            data-testid="modal:close"
                            onClick={() => {
                                modalProps.onClose?.();
                            }}
                        >
                            <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                        </CoreButton>
                    </Tooltip>
                </div>
            }
        >
            <div className="flex flex-column">
                {feeOptions.map(([iconName, text, feeRate, feesAtFeeRate]) => (
                    <button
                        key={feeRate}
                        onClick={() => {
                            void handleFeesSelection(feeRate);
                        }}
                        className="fees-selection-button unstyled flex flex-row py-4 px-6 items-center"
                    >
                        <div className="flex items-center justify-center bg-norm rounded-full p-4">
                            <Icon name={iconName} />
                        </div>
                        <div className="mx-4">{text}</div>
                        <div className="flex flex-column items-end ml-auto">
                            <div className="mb-1">
                                {exchangeRate && <Price amount={feesAtFeeRate} unit={exchangeRate} />}
                            </div>

                            <span className="block color-hint">
                                {secondaryAmount({
                                    key: 'hint-total-amount',
                                    settingsBitcoinUnit: settings.BitcoinUnit,
                                    secondaryExchangeRate: accountExchangeRate,
                                    primaryExchangeRate: exchangeRate,
                                    value: feesAtFeeRate,
                                })}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </Modal>
    );
};
