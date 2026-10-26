import { c } from 'ttag';

import { formatUsdAmount, getApiModelPricingUsd } from '../api-docs/apiTokenPricingUsd';
import { formatTokenCount } from './apiKeysHelpers';

const RateHint = ({ amount }: { amount: number | undefined }) => {
    if (amount === undefined) {
        return null;
    }

    const formattedAmount = formatUsdAmount(amount);
    return (
        <small className="api-usage-model__rate">{c('collider_2025: Label').t`${formattedAmount} per 1M tokens`}</small>
    );
};

const getRatesNote = (cacheInput: number | null) => {
    if (cacheInput === null) {
        return c('collider_2025: Info').t`Prices shown in USD.`;
    }

    const formattedCacheInput = formatUsdAmount(cacheInput);
    return c('collider_2025: Info').t`Cached input ${formattedCacheInput} per 1M tokens. Prices shown in USD.`;
};

/** Per-model usage stats with the matching USD list price shown under each figure. */
export const ApiUsageModelStats = ({
    model,
    inputTokens,
    outputTokens,
    formattedCost,
}: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    formattedCost: string;
}) => {
    const rates = getApiModelPricingUsd(model);

    return (
        <>
            <div className="api-usage-model__stats mt-3">
                <div className="flex flex-column gap-0.5">
                    <span>{c('collider_2025: Label').t`Input`}</span>
                    <strong>{formatTokenCount(inputTokens)}</strong>
                    <RateHint amount={rates?.input} />
                </div>
                <div className="flex flex-column gap-0.5">
                    <span>{c('collider_2025: Label').t`Output`}</span>
                    <strong>{formatTokenCount(outputTokens)}</strong>
                    <RateHint amount={rates?.output} />
                </div>
                <div className="flex flex-column gap-0.5">
                    <span>{c('collider_2025: Label').t`Balance used`}</span>
                    <strong>{formattedCost}</strong>
                </div>
            </div>
            {rates ? <p className="api-usage-model__rates-note">{getRatesNote(rates.cacheInput)}</p> : null}
        </>
    );
};
