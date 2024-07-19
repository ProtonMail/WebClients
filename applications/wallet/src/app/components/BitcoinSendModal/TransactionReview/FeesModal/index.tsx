import { useCallback, useEffect, useState } from 'react';

import { noop } from 'lodash';
import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmBitcoinUnit, WasmTxBuilder } from '@proton/andromeda';
import type { IconName } from '@proton/components/components';
import { Icon, Tooltip } from '@proton/components/components';
import type { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import { useUserWalletSettings } from '@proton/wallet';

import { BitcoinAmount, Modal } from '../../../../atoms';
import { CoreButton } from '../../../../atoms/Button';
import { usePsbt } from '../../../../hooks/usePsbt';
import type { TxBuilderUpdater } from '../../../../hooks/useTxBuilder';
import { isExchangeRate } from '../../../../utils';

import './FeesModal.scss';

interface Props extends ModalOwnProps {
    unit: WasmBitcoinUnit | WasmApiExchangeRate;
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: TxBuilderUpdater) => void;
    getFeesByBlockTarget: (blockTarget: number) => number | undefined;
}

export const FeesModal = ({ unit, txBuilder, updateTxBuilder, getFeesByBlockTarget, ...modalProps }: Props) => {
    const [settings] = useUserWalletSettings();
    const { createDraftPsbt } = usePsbt({ txBuilder });

    const getTransactionFeesAtFeeRate = useCallback(
        async (feeRate: number) => {
            const updatedTxBuilder = await txBuilder.setFeeRate(BigInt(feeRate));
            const psbt = await createDraftPsbt(updatedTxBuilder);
            return Number(psbt?.total_fees ?? 0);
        },
        [createDraftPsbt, txBuilder]
    );

    const getFeeOption = useCallback(
        async (icon: IconName, text: string, blockTarget: number): Promise<[IconName, string, number, number]> => {
            const feeRate = getFeesByBlockTarget(blockTarget) ?? 0;
            //  expected to be non-deterministic since input selection during PSBT creation is random
            return [icon, text, feeRate, await getTransactionFeesAtFeeRate(feeRate)];
        },
        [getFeesByBlockTarget, getTransactionFeesAtFeeRate]
    );

    const [feeOptions, setFeeOptions] = useState<[IconName, string, number, number][]>([]);

    useEffect(() => {
        Promise.all([
            getFeeOption('chevron-up', c('Wallet send').t`High priority`, 2),
            getFeeOption('minus', c('Wallet send').t`Median priority`, 5),
            getFeeOption('chevron-down', c('Wallet send').t`Low priority`, 10),
        ])
            .then((options) => {
                setFeeOptions(options);
            })
            .catch(noop);
    }, [getFeeOption]);

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
                            updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(feeRate)));
                            modalProps.onClose?.();
                        }}
                        className="fees-selection-button unstyled flex flex-row py-4 px-6 items-center"
                    >
                        <div className="flex items-center justify-center bg-norm rounded-full p-4">
                            <Icon name={iconName} />
                        </div>
                        <div className="mx-4">{text}</div>
                        <div className="flex flex-column items-end ml-auto">
                            <BitcoinAmount
                                bitcoin={feesAtFeeRate}
                                unit={{ value: settings.BitcoinUnit }}
                                exchangeRate={isExchangeRate(unit) ? { value: unit } : undefined}
                                firstClassName="text-right"
                                secondClassName="text-right"
                            />
                        </div>
                    </button>
                ))}
            </div>
        </Modal>
    );
};
