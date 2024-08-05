import { useCallback, useEffect, useState } from 'react';

import { noop } from 'lodash';
import { c } from 'ttag';

import type { WasmApiExchangeRate } from '@proton/andromeda';
import type { IconName } from '@proton/components/components';
import { Icon, Tooltip } from '@proton/components/components';
import type { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import { useUserWalletSettings } from '@proton/wallet';

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
    psbtExpectedSize: number | undefined;
    getFeesByBlockTarget: (blockTarget: number) => number | undefined;
}

export const FeesModal = ({
    accountExchangeRate,
    exchangeRate,
    txBuilderHelpers,
    getFeesByBlockTarget,
    psbtExpectedSize,
    ...modalProps
}: Props) => {
    const { updateTxBuilder, updateTxBuilderAsync } = txBuilderHelpers;

    const [settings] = useUserWalletSettings();

    const getFeeOption = useCallback(
        async (icon: IconName, text: string, blockTarget: number): Promise<[IconName, string, number, number]> => {
            const feeRate = getFeesByBlockTarget(blockTarget) ?? 0;
            //  expected to be non-deterministic since input selection during PSBT creation is random
            return [icon, text, feeRate, feeRate * (psbtExpectedSize ?? 0)];
        },
        [getFeesByBlockTarget, psbtExpectedSize]
    );

    const [feeOptions, setFeeOptions] = useState<[IconName, string, number, number][]>([]);

    useEffect(() => {
        Promise.all([
            getFeeOption('chevron-up', c('Wallet send').t`High priority`, 1),
            getFeeOption('minus', c('Wallet send').t`Median priority`, 5),
            getFeeOption('chevron-down', c('Wallet send').t`Low priority`, 10),
        ])
            .then((options) => {
                setFeeOptions(options);
            })
            .catch(noop);
    }, [getFeeOption]);

    const handleFeesSelection = async (feeRate: number) => {
        updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(feeRate)));
        updateTxBuilderAsync((txBuilder) => txBuilder.constrainRecipientAmounts());

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
                                {exchangeRate && <Price satsAmount={feesAtFeeRate} unit={exchangeRate} />}
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
