import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { ApiModel } from './apiModels';
import { formatUsdAmount, getApiModelPricingUsd } from './apiTokenPricingUsd';

import './ApiModelsCatalogSection.scss';

const formatContextLength = (tokens: number) =>
    tokens % 1024 === 0 ? `${tokens / 1024}k` : new Intl.NumberFormat().format(tokens);

const modelCapabilities = (model: ApiModel) =>
    [
        model.capabilities.completionChat && {
            id: 'completion-chat',
            label: c('collider_2025: Model capability').t`chat`,
        },
        model.capabilities.functionCalling && {
            id: 'function-calling',
            label: c('collider_2025: Model capability').t`function calling`,
        },
        model.capabilities.vision && {
            id: 'vision',
            label: c('collider_2025: Model capability').t`vision`,
        },
    ].filter((capability): capability is { id: string; label: string } => Boolean(capability));

const HeadlinePrice = ({ label, amount }: { label: string; amount: number }) => (
    <div className="api-docs-model-catalog-headline">
        <div className="api-docs-model-catalog-headline-label">{label}</div>
        <div className="api-docs-model-catalog-headline-amount">{formatUsdAmount(amount)}</div>
        <div className="api-docs-model-catalog-headline-unit">{c('collider_2025: Label').t`per 1M tokens`}</div>
    </div>
);

const ModelCatalogCard = ({ model }: { model: ApiModel }) => {
    const pricing = getApiModelPricingUsd(model.id);
    const capabilities = modelCapabilities(model);

    return (
        <article className="api-docs-model-catalog-card">
            <header className="api-docs-model-catalog-header">
                <div className="flex flex-row flex-wrap items-baseline justify-space-between gap-2">
                    <h3 className="api-docs-model-catalog-name m-0">{model.name}</h3>
                    <code className="api-docs-model-catalog-id text-monospace">{model.id}</code>
                </div>
                <p className="api-docs-model-catalog-description m-0">{model.description}</p>
            </header>

            <div className="api-docs-model-catalog-pricing">
                {pricing ? (
                    <>
                        <div className="api-docs-model-catalog-headlines">
                            <HeadlinePrice label={c('collider_2025: Label').t`Input`} amount={pricing.input} />
                            <HeadlinePrice label={c('collider_2025: Label').t`Output`} amount={pricing.output} />
                        </div>
                        {pricing.cacheInput !== null ? (
                            <div className="api-docs-model-catalog-cached">
                                <span>{c('collider_2025: Label').t`Cached input`}</span>
                                <span className="api-docs-model-catalog-cached-amount">
                                    {formatUsdAmount(pricing.cacheInput)}
                                    <span className="api-docs-model-catalog-cached-unit">{' / MTok'}</span>
                                </span>
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="api-docs-model-catalog-no-pricing">
                        {c('collider_2025: Info').t`Pricing not yet listed`}
                    </div>
                )}
            </div>

            <footer className="api-docs-model-catalog-footer">
                <div className="api-docs-model-catalog-capabilities">
                    {capabilities.map((capability) => (
                        <span key={capability.id} className="api-docs-model-catalog-capability">
                            {capability.label}
                        </span>
                    ))}
                </div>
                <div className="api-docs-model-catalog-context">
                    <span className="api-docs-model-catalog-context-label">{c('collider_2025: Label').t`Context`}</span>
                    <span className="api-docs-model-catalog-context-value text-monospace">
                        {formatContextLength(model.maxContextLength)}
                    </span>
                </div>
            </footer>
        </article>
    );
};

export type ApiModelsCatalogStatus = 'loading' | 'success' | 'error';

export const ApiModelsCatalogSection = ({
    status,
    models,
    onRetry,
}: {
    status: ApiModelsCatalogStatus;
    models: ApiModel[];
    onRetry: () => void;
}) => (
    <section id="models" className="api-docs-page-section-anchor mb-14">
        <h2 className="text-bold text-xl mt-0 mb-2">{c('collider_2025: Title').t`Models & pricing`}</h2>
        <p className="color-weak mt-0 mb-6" style={{ lineHeight: 1.7, maxWidth: '44rem' }}>
            {c('collider_2025: Info')
                .t`Pass a model ID in your request. Prices are list prices in USD per million tokens (MTok).`}
        </p>

        {status === 'loading' && models.length === 0 ? (
            <div className="rounded-lg border border-weak p-4 color-weak">
                {c('collider_2025: Info').t`Loading available models…`}
            </div>
        ) : null}

        {status === 'error' ? (
            <div className="rounded-lg border border-weak p-4 flex items-center justify-space-between gap-3">
                <span className="color-weak">{c('collider_2025: Error').t`Available models could not be loaded.`}</span>
                <Button size="small" color="weak" onClick={onRetry}>
                    {c('collider_2025: Action').t`Retry`}
                </Button>
            </div>
        ) : null}

        {status === 'success' && models.length === 0 ? (
            <div className="rounded-lg border border-weak p-4 color-weak">
                {c('collider_2025: Info').t`No API models are currently available.`}
            </div>
        ) : null}

        {models.length > 0 ? (
            <div className="api-docs-model-catalog-grid">
                {models.map((model) => (
                    <ModelCatalogCard key={model.id} model={model} />
                ))}
            </div>
        ) : null}
    </section>
);
