import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import {
    Badge,
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components/components';
import { BadgeType } from '@proton/components/components/badge/Badge';

import { WasmTxBuilder } from '../../../pkg';
import { FeeSelectionModal } from './FeeSelectionModal';
import { FeeRateNote, useOnChainFeesSelector } from './useOnChainFeesSelector';

const labelColorByFeeRateNote: Record<FeeRateNote, BadgeType> = {
    LOW: 'error',
    HIGH: 'warning',
    MODERATE: 'success',
};

const labelTextByFeeRateNote: Record<FeeRateNote, () => string> = {
    LOW: () => c('Wallet Send').t`Low`,
    HIGH: () => c('Wallet Send').t`High`,
    MODERATE: () => c('Wallet Send').t`Moderate`,
};

interface Props {
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: (txBuilder: WasmTxBuilder) => WasmTxBuilder) => void;
}

export const OnChainFeesSelector = ({ txBuilder, updateTxBuilder }: Props) => {
    const {
        feeEstimations,
        blockTarget,
        loadingFeeEstimation,
        isModalOpen,
        isRecommended,
        feeRateNote,
        handleFeesSelected,
        closeModal,
        openModal,
    } = useOnChainFeesSelector(txBuilder, updateTxBuilder);

    const feeRate = txBuilder.get_fee_rate() ?? 1;

    const strFeeRate = feeRate.toFixed(2);

    return (
        <>
            <div className="flex flex-column">
                <Collapsible>
                    <CollapsibleHeader
                        suffix={
                            <CollapsibleHeaderIconButton>
                                <Icon name="chevron-down" />
                            </CollapsibleHeaderIconButton>
                        }
                    >
                        <div className="flex flex-row">
                            <h3 className="text-rg text-semibold flex-1">{c('Wallet Send').t`Fees`}</h3>
                            <Badge type={labelColorByFeeRateNote[feeRateNote]}>
                                {labelTextByFeeRateNote[feeRateNote]()}
                            </Badge>
                            {isRecommended && (
                                <Badge className="mr-0" type="primary">{c('Wallet Send').t`Recommended`}</Badge>
                            )}
                        </div>
                    </CollapsibleHeader>
                    <CollapsibleContent>
                        <div className="mt-4 flex flex-row justify-space-between">
                            {!loadingFeeEstimation ? (
                                <div>
                                    <span className="block color-hint">
                                        {c('Wallet send').ngettext(
                                            msgid`${strFeeRate}sat/vb`,
                                            `${strFeeRate}sats/vb`,
                                            feeRate
                                        )}
                                    </span>
                                    <span className="block color-hint">{c('Wallet Send').t`Confirmation in ~${
                                        blockTarget * 10
                                    } minutes expected`}</span>
                                </div>
                            ) : (
                                <CircleLoader size="small" />
                            )}

                            <Button
                                className="text-sm"
                                size="small"
                                shape="underline"
                                onClick={openModal}
                                disabled={loadingFeeEstimation}
                            >{c('Wallet Send').t`Modify`}</Button>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
            <FeeSelectionModal
                isOpen={isModalOpen}
                feeEstimations={feeEstimations}
                feeRate={feeRate}
                blockTarget={blockTarget}
                onClose={closeModal}
                onFeeRateSelected={handleFeesSelected}
            />
        </>
    );
};
