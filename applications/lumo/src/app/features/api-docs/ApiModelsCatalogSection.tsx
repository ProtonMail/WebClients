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
        <div className="api-docs-model-catalog-headline-label lumo-label-small lumo-color-glyph-mid">{label}</div>
        <div className="api-docs-model-catalog-headline-amount lumo-headline-small lumo-color-glyph">
            {formatUsdAmount(amount)}
        </div>
        <div className="api-docs-model-catalog-headline-unit lumo-label-small lumo-color-glyph-mid">{c(
            'collider_2025: Label'
        ).t`per 1M tokens`}</div>
    </div>
);

const ModelCatalogCard = ({ model }: { model: ApiModel }) => {
    const pricing = getApiModelPricingUsd(model.id);
    const capabilities = modelCapabilities(model);

    return (
        <article className="api-docs-model-catalog-card gap-y-0 mb-4 border radius-12 lumo-bg-panel">
            <header className="api-docs-model-catalog-header">
                <div className="flex flex-row flex-wrap items-baseline justify-space-between gap-2">
                    <h3 className="api-docs-model-catalog-name m-0 lumo-title-medium lumo-color-glyph">{model.name}</h3>
                    <code className="api-docs-model-catalog-id radius-4 lumo-font-mono lumo-color-glyph-mid lumo-bg-control-fill">
                        {model.id}
                    </code>
                </div>
                <p className="api-docs-model-catalog-description m-0 lumo-body-medium lumo-color-glyph-mid">
                    {model.description}
                </p>
            </header>

            <div className="api-docs-model-catalog-pricing">
                {pricing ? (
                    <>
                        <div className="api-docs-model-catalog-headlines gap-4">
                            <HeadlinePrice label={c('collider_2025: Label').t`Input`} amount={pricing.input} />
                            <HeadlinePrice label={c('collider_2025: Label').t`Output`} amount={pricing.output} />
                        </div>
                        {pricing.cacheInput !== null ? (
                            <div className="api-docs-model-catalog-cached lumo-body-small gap-2 pt-3 lumo-color-glyph-mid">
                                <span>{c('collider_2025: Label').t`Cached input`}</span>
                                <span className="api-docs-model-catalog-cached-amount lumo-color-glyph">
                                    {formatUsdAmount(pricing.cacheInput)}
                                    <span className="api-docs-model-catalog-cached-unit lumo-label-medium lumo-color-glyph-mid">
                                        {' / MTok'}
                                    </span>
                                </span>
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="api-docs-model-catalog-no-pricing lumo-body-medium lumo-color-glyph-mid">
                        {c('collider_2025: Info').t`Pricing not yet listed`}
                    </div>
                )}
            </div>

            <footer className="api-docs-model-catalog-footer gap-y-2 gap-x-4">
                <div className="api-docs-model-catalog-capabilities">
                    {capabilities.map((capability) => (
                        <span
                            key={capability.id}
                            className="api-docs-model-catalog-capability radius-4 lumo-label-small lumo-color-glyph-brand-text lumo-bg-control-fill"
                        >
                            {capability.label}
                        </span>
                    ))}
                </div>
                <div className="api-docs-model-catalog-context lumo-body-small">
                    <span className="api-docs-model-catalog-context-label lumo-color-glyph-mid">{c(
                        'collider_2025: Label'
                    ).t`Context`}</span>
                    <span className="api-docs-model-catalog-context-value lumo-font-mono lumo-color-glyph">
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
        <h2 className="mt-0 mb-2 lumo-title-large">{c('collider_2025: Title').t`Models & pricing`}</h2>
        <p className="mt-0 mb-6 lumo-color-glyph-mid" style={{ lineHeight: 1.7, maxWidth: '44rem' }}>
            {c('collider_2025: Info')
                .t`Pass a model ID in your request. Prices are list prices in USD per million tokens (MTok).`}
        </p>

        {status === 'loading' && models.length === 0 ? (
            <div className="p-4 border radius-12 lumo-color-glyph-mid">
                {c('collider_2025: Info').t`Loading available models…`}
            </div>
        ) : null}

        {status === 'error' ? (
            <div className="flex items-center justify-space-between gap-3 p-4 border radius-12">
                <span className="lumo-color-glyph-mid">{c('collider_2025: Error')
                    .t`Available models could not be loaded.`}</span>
                <Button size="small" color="weak" onClick={onRetry}>
                    {c('collider_2025: Action').t`Retry`}
                </Button>
            </div>
        ) : null}

        {status === 'success' && models.length === 0 ? (
            <div className="p-4 border radius-12 lumo-color-glyph-mid">
                {c('collider_2025: Info').t`No API models are currently available.`}
            </div>
        ) : null}

        {models.length > 0 ? (
            <div className="api-docs-model-catalog-grid gap-y-0 gap-x-4">
                {models.map((model) => (
                    <ModelCatalogCard key={model.id} model={model} />
                ))}
            </div>
        ) : null}
    </section>
);
