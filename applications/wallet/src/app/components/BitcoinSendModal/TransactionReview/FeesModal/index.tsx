import { c } from 'ttag';

import { WasmApiExchangeRate, WasmBitcoinUnit, WasmTxBuilder } from '@proton/andromeda';
import { Icon, IconName, Tooltip } from '@proton/components/components';
import { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';

import { BitcoinAmount, Modal } from '../../../../atoms';
import { Button } from '../../../../atoms/Button';
import { usePsbt } from '../../../../hooks/usePsbt';
import { TxBuilderUpdater } from '../../../../hooks/useTxBuilder';
import { useUserWalletSettings } from '../../../../store/hooks/useUserWalletSettings';
import { isExchangeRate } from '../../../../utils';
import { useAsyncValue } from '../../../../utils/hooks/useAsyncValue';

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

    const getTransactionFeesAtFeeRate = async (feeRate: number) => {
        const updatedTxBuilder = await txBuilder.setFeeRate(BigInt(feeRate));
        const psbt = await createDraftPsbt(updatedTxBuilder);
        return Number(psbt?.total_fees ?? 0);
    };

    const getFeeOption = async (
        icon: IconName,
        text: string,
        blockTarget: number
    ): Promise<[IconName, string, number, number]> => {
        const feeRate = getFeesByBlockTarget(blockTarget) ?? 0;
        //  expected to be non-deterministic since input selection during PSBT creation is random
        return [icon, text, feeRate, await getTransactionFeesAtFeeRate(feeRate)];
    };

    const feeOptions = useAsyncValue<[IconName, string, number, number][]>(
        Promise.all([
            getFeeOption('chevron-up', c('Wallet send').t`High priority`, 2),
            getFeeOption('minus', c('Wallet send').t`Median priority`, 5),
            getFeeOption('chevron-down', c('Wallet send').t`Low priority`, 10),
        ]),
        []
    );

    return (
        <Modal
            {...modalProps}
            className="fees-selection-modal"
            size="small"
            header={
                <div className="flex flex-row justify-space-between px-6 items-center my-4">
                    <h1 className="text-lg text-semibold">{c('Wallet send').t`Network fees`}</h1>

                    <Tooltip title={c('Action').t`Close`}>
                        <Button
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
                        </Button>
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
