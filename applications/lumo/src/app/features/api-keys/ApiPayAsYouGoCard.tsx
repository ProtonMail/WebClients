import { c } from 'ttag';

import {
    API_TOKEN_PRICING_MODEL_IDS,
    API_TOKEN_PRICING_USD_PER_MILLION,
    type ApiTokenPricingUsdPerMillion,
    formatUsdAmount,
} from '../api-docs/apiTokenPricingUsd';

export const ApiPayAsYouGoCard = () => {
    const rows: { id: keyof ApiTokenPricingUsdPerMillion; label: string }[] = [
        { id: 'input', label: c('collider_2025: Label').t`Input` },
        { id: 'output', label: c('collider_2025: Label').t`Output` },
        { id: 'cacheInput', label: c('collider_2025: Label').t`Cached input` },
    ];

    return (
        <section
            className="api-usage-plan-card flex flex-column rounded-xl border border-weak bg-norm"
            aria-labelledby="api-usage-plan-title"
        >
            <div className="api-usage-plan-card__header">
                <h3 id="api-usage-plan-title" className="text-lg text-semibold color-norm m-0">
                    {c('collider_2025: Title').t`Pay as you go`}
                </h3>
                <p className="text-sm color-weak m-0 mt-1">
                    {c('collider_2025: Info').t`Pay only for the tokens you use. Prices in USD per 1M tokens.`}
                </p>
            </div>

            <table className="api-usage-plan-card__table">
                <thead>
                    <tr>
                        <th scope="col">
                            <span className="sr-only">{c('collider_2025: Label').t`Token type`}</span>
                        </th>
                        {API_TOKEN_PRICING_MODEL_IDS.map((modelId) => (
                            <th key={modelId} scope="col">
                                <code>{modelId}</code>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <th scope="row">{row.label}</th>
                            {API_TOKEN_PRICING_MODEL_IDS.map((modelId) => {
                                const amount = API_TOKEN_PRICING_USD_PER_MILLION[modelId][row.id];
                                return (
                                    <td key={modelId}>
                                        {amount === null ? (
                                            <span className="color-weak">{c('collider_2025: Label')
                                                .t`Not billed`}</span>
                                        ) : (
                                            formatUsdAmount(amount)
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
};
