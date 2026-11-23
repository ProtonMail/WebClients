import { useMemo, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { LumoIcon } from '../../LumoIcon/LumoIcon';
import { LumoMarkdownCodeBlock } from '../LumoMarkdownCodeBlock';
import { prettyJson } from './chartSpecDisplay';

type SpecView = 'rendered' | 'raw';

interface VegaChartSourceButtonProps {
    expanded: boolean;
    onToggle: () => void;
}

export const VegaChartSourceButton = ({ expanded, onToggle }: VegaChartSourceButtonProps) => {
    const label = expanded ? c('Action').t`Hide chart spec` : c('Action').t`View chart spec`;

    return (
        <Tooltip title={label}>
            <Button
                icon
                color="weak"
                shape="ghost"
                size="small"
                aria-label={label}
                aria-expanded={expanded}
                className="vega-lite-chart__action-button"
                onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                }}
            >
                <LumoIcon name="Code" size={16} />
            </Button>
        </Tooltip>
    );
};

interface VegaChartSpecPanelProps {
    rawCode: string;
    renderedSpecJson: string | null;
    renderError?: string | null;
    sanitizeError?: string | null;
}

export const VegaChartSpecPanel = ({
    rawCode,
    renderedSpecJson,
    renderError = null,
    sanitizeError = null,
}: VegaChartSpecPanelProps) => {
    const [activeView, setActiveView] = useState<SpecView>('rendered');

    const rawSpec = useMemo(() => prettyJson(rawCode), [rawCode]);
    const hasDiff = !!renderedSpecJson && rawSpec !== renderedSpecJson;
    const displayCode = activeView === 'rendered' && renderedSpecJson ? renderedSpecJson : rawSpec;
    const displayLabel = activeView === 'rendered' ? c('Info').t`Rendered spec` : c('Info').t`Model output`;

    return (
        <div className="vega-lite-chart__source-panel lumo-no-copy mt-3 pt-3 border-top lumo-border">
            {renderError ? (
                <p className="vega-lite-chart__source-error mt-0 mb-2 mx-0 lumo-label-small lumo-color-signal-danger">
                    {renderError}
                </p>
            ) : null}
            {sanitizeError && !renderedSpecJson ? (
                <p className="vega-lite-chart__source-error mt-0 mb-2 mx-0 lumo-label-small lumo-color-signal-danger">
                    {sanitizeError}
                </p>
            ) : null}
            {hasDiff ? (
                <div
                    className="vega-lite-chart__source-switch flex flex-wrap gap-1.5 mb-2"
                    role="tablist"
                    aria-label={c('Info').t`Chart spec view`}
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeView === 'rendered'}
                        className={clsx(
                            'vega-lite-chart__source-switch-button py-1 px-2.5 border radius-full lumo-label-small',
                            {
                                'vega-lite-chart__source-switch-button--active': activeView === 'rendered',
                            }
                        )}
                        onClick={() => setActiveView('rendered')}
                    >
                        {c('Info').t`Rendered spec`}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeView === 'raw'}
                        className={clsx(
                            'vega-lite-chart__source-switch-button py-1 px-2.5 border radius-full lumo-label-small',
                            {
                                'vega-lite-chart__source-switch-button--active': activeView === 'raw',
                            }
                        )}
                        onClick={() => setActiveView('raw')}
                    >
                        {c('Info').t`Model output`}
                    </button>
                </div>
            ) : (
                <p className="vega-lite-chart__source-label mt-0 mb-2 mx-0 lumo-label-small">{displayLabel}</p>
            )}
            <LumoMarkdownCodeBlock code={displayCode} language="json" />
        </div>
    );
};
