import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Pill from '@proton/atoms/Pill/Pill';

import { AVERAGE_TIMEGAP_BETWEEN_BLOCKS } from '../../../../constants';
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
    feesSelectorHelpers: ReturnType<typeof useOnChainFeesSelector>;
    switchToFeesSelectionModal: () => void;
}

export const OnChainFeesSelector = ({ feesSelectorHelpers, switchToFeesSelectionModal }: Props) => {
    const { feeRate, feeRateNote, blockTarget, isRecommended } = feesSelectorHelpers;

    const strFeeRate = feeRate.toFixed(2);
    const estimatedConfirmationTime = blockTarget * AVERAGE_TIMEGAP_BETWEEN_BLOCKS;

    return (
        <>
            <div className="flex flex-column mb-4">
                <div className="flex flex-row">
                    <h3 className="text-rg text-semibold flex-1">{c('Wallet Send').t`Fees`}</h3>
                    <Pill className="block " backgroundColor={labelColorByFeeRateNote[feeRateNote]}>
                        {labelTextByFeeRateNote[feeRateNote]()}
                    </Pill>
                    {isRecommended && (
                        <Pill className="block ml-2" color="#1B1340">{c('Wallet Send').t`Recommended`}</Pill>
                    )}
                </div>

                <div className="flex flex-row justify-space-between">
                    <div className="color-hint text-sm">
                        <span className="block">
                            {c('Wallet send').ngettext(msgid`${strFeeRate}sat/vb`, `${strFeeRate}sats/vb`, feeRate)}
                        </span>
                        <span className="block">{c('Wallet Send')
                            .t`Confirmation in ~${estimatedConfirmationTime} minutes expected`}</span>
                    </div>

                    <Button
                        className="text-sm"
                        size="small"
                        shape="underline"
                        onClick={() => switchToFeesSelectionModal()}
                    >
                        {c('Wallet Send').t`Modify`}
                    </Button>
                </div>
            </div>
        </>
    );
};
