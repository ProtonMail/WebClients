import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { ApiModel } from './apiModels';
import { API_TOKEN_PRICING_MODEL_IDS, API_TOKEN_PRICING_USD_PER_MILLION, formatUsdAmount } from './apiTokenPricingUsd';

import './ApiPricingSummary.scss';

const Price = ({ amount }: { amount: number | null }) =>
    amount === null ? (
        <span className="api-docs-pricing-summary-na lumo-body-medium lumo-color-glyph-mid">{c('collider_2025: Label')
            .t`Not billed`}</span>
    ) : (
        <span className="api-docs-pricing-summary-price lumo-title-medium lumo-color-glyph">
            {formatUsdAmount(amount)}
        </span>
    );

export const ApiPricingSummary = ({ onViewModels, models = [] }: { onViewModels: () => void; models?: ApiModel[] }) => (
    <section aria-labelledby="api-pricing-summary-title" className="mb-8">
        <div className="flex flex-row flex-wrap items-end justify-space-between gap-2 mb-3">
            <div>
                <h2 id="api-pricing-summary-title" className="mt-0 mb-1 lumo-title-large">
                    {c('collider_2025: Title').t`Pricing`}
                </h2>
                <p className="m-0 lumo-color-glyph-mid">
                    {c('collider_2025: Info').t`Pay per token. Prices in USD per 1 million tokens (MTok).`}
                </p>
            </div>
            <Button size="small" color="weak" shape="ghost" onClick={onViewModels}>
                {c('collider_2025: Action').t`View all models`}
            </Button>
        </div>

        <div className="api-docs-pricing-summary border lumo-border radius-12 lumo-bg-panel">
            <table className="api-docs-pricing-summary-table">
                <thead>
                    <tr>
                        <th scope="col">{c('collider_2025: Label').t`Model`}</th>
                        <th scope="col">{c('collider_2025: Label').t`Input`}</th>
                        <th scope="col">{c('collider_2025: Label').t`Output`}</th>
                        <th scope="col">{c('collider_2025: Label').t`Cached input`}</th>
                    </tr>
                </thead>
                <tbody>
                    {API_TOKEN_PRICING_MODEL_IDS.map((modelId) => {
                        const rates = API_TOKEN_PRICING_USD_PER_MILLION[modelId];
                        const label = models.find((m) => m.id === modelId)?.name ?? modelId;
                        return (
                            <tr key={modelId}>
                                <th scope="row" className="api-docs-pricing-summary-model">
                                    <strong>{label}</strong>
                                    <code className="lumo-font-mono">{modelId}</code>
                                </th>
                                <td data-label={c('collider_2025: Label').t`Input`}>
                                    <Price amount={rates.input} />
                                </td>
                                <td data-label={c('collider_2025: Label').t`Output`}>
                                    <Price amount={rates.output} />
                                </td>
                                <td data-label={c('collider_2025: Label').t`Cached input`}>
                                    <Price amount={rates.cacheInput} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </section>
);
