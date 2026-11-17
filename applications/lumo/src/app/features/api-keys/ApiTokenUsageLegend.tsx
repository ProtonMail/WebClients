import type { CSSProperties } from 'react';

import { c } from 'ttag';

import type { UsageSource } from './apiUsage';

type TokenSeries = 'apiInputTokens' | 'apiOutputTokens' | 'chatInputTokens' | 'chatOutputTokens';

const lighter = (color: string) => `color-mix(in srgb, ${color} 45%, var(--background-norm))`;

export const TOKEN_SERIES_FILL: Record<TokenSeries, string> = {
    apiInputTokens: 'var(--interaction-norm)',
    apiOutputTokens: lighter('var(--interaction-norm)'),
    chatInputTokens: 'var(--signal-warning)',
    chatOutputTokens: lighter('var(--signal-warning)'),
};

export const TOKEN_SERIES: { key: TokenSeries; source: UsageSource; getLabel: () => string }[] = [
    { key: 'apiInputTokens', source: 'api', getLabel: () => c('collider_2025: Label').t`API input` },
    { key: 'apiOutputTokens', source: 'api', getLabel: () => c('collider_2025: Label').t`API output` },
    { key: 'chatInputTokens', source: 'chat', getLabel: () => c('collider_2025: Label').t`Chat input` },
    { key: 'chatOutputTokens', source: 'chat', getLabel: () => c('collider_2025: Label').t`Chat output` },
];

export const getSwatchStyle = (series: TokenSeries) => ({ '--swatch': TOKEN_SERIES_FILL[series] }) as CSSProperties;

export const ApiTokenUsageLegend = ({ source }: { source: 'all' | UsageSource }) => (
    <div className="api-usage-chart-legend flex flex-wrap justify-end gap-3">
        {TOKEN_SERIES.filter((series) => source === 'all' || series.source === source).map(({ key, getLabel }) => (
            <span key={key} className="inline-flex items-center gap-1.5" style={getSwatchStyle(key)}>
                {getLabel()}
            </span>
        ))}
    </div>
);
