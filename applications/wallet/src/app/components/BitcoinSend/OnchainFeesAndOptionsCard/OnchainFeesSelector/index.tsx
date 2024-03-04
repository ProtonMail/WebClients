import { c, msgid } from 'ttag';

import { WasmTxBuilder } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button/Button';
import Pill from '@proton/atoms/Pill/Pill';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import Icon from '@proton/components/components/icon/Icon';

import { FeeSelectionModal } from './FeeSelectionModal';
import { FeeRateNote, useOnChainFeesSelector } from './useOnChainFeesSelector';

const labelColorByFeeRateNote: Record<FeeRateNote, string> = {
    LOW: '#ffa79d',
    HIGH: '#ffd50d',
    MODERATE: '#d0ffb7',
};

const labelTextByFeeRateNote: Record<FeeRateNote, () => string> = {
    LOW: () => c('Wallet Send').t`Low`,
    HIGH: () => c('Wallet Send').t`High`,
    MODERATE: () => c('Wallet Send').t`Moderate`,
};

interface Props {
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: (txBuilder: WasmTxBuilder) => WasmTxBuilder | Promise<WasmTxBuilder>) => void;
}

export const OnChainFeesSelector = ({ txBuilder, updateTxBuilder }: Props) => {
    const {
        feesEstimations,
        blockTarget,
        isModalOpen,
        isRecommended,
        feeRateNote,
        handleFeesSelected,
        closeModal,
        openModal,
    } = useOnChainFeesSelector(txBuilder, updateTxBuilder);

    const feeRate = txBuilder.getFeeRate() ?? 1;

    const strFeeRate = feeRate.toFixed(2);
    const estimatedConfirmationTime = blockTarget * 10;

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
                            <Pill className="block mr-2" backgroundColor={labelColorByFeeRateNote[feeRateNote]}>
                                {labelTextByFeeRateNote[feeRateNote]()}
                            </Pill>
                            {isRecommended && <Pill color="#1B1340">{c('Wallet Send').t`Recommended`}</Pill>}
                        </div>
                    </CollapsibleHeader>
                    <CollapsibleContent>
                        <div className="mt-4 flex flex-row justify-space-between">
                            <div>
                                <span className="block color-hint">
                                    {c('Wallet send').ngettext(
                                        msgid`${strFeeRate}sat/vb`,
                                        `${strFeeRate}sats/vb`,
                                        feeRate
                                    )}
                                </span>
                                <span className="block color-hint">{c('Wallet Send')
                                    .t`Confirmation in ~${estimatedConfirmationTime} minutes expected`}</span>
                            </div>

                            <Button className="text-sm" size="small" shape="underline" onClick={() => openModal()}>
                                {c('Wallet Send').t`Modify`}
                            </Button>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
            <FeeSelectionModal
                isOpen={isModalOpen}
                feesEstimations={feesEstimations}
                feeRate={feeRate}
                onClose={closeModal}
                onFeeRateSelected={handleFeesSelected}
            />
        </>
    );
};
