import { clsx } from 'clsx';

import { LUMO_MARKDOWN_CARD_SHELL_CLASS } from '../lumoMarkdownCardShell';
import type { LumoCardDirection, LumoCardSpec } from './cardTypes';

import './LumoInsightCard.scss';

function deltaPrefix(direction: LumoCardDirection | undefined): string {
    if (direction === 'up') {
        return '▲';
    }

    if (direction === 'down') {
        return '▼';
    }

    return '–';
}

function severityClass(severity: LumoCardSpec['severity']): string | undefined {
    if (severity === 'warning') {
        return 'lumo-insight-card--finding-warning';
    }

    if (severity === 'critical') {
        return 'lumo-insight-card--finding-critical';
    }

    return undefined;
}

export const LumoInsightCard = ({ spec }: { spec: LumoCardSpec }) => {
    if (spec.type === 'metric') {
        const direction = spec.direction ?? 'flat';

        return (
            <div
                className={clsx(
                    LUMO_MARKDOWN_CARD_SHELL_CLASS,
                    'lumo-insight-card lumo-insight-card--metric flex flex-column flex-1 w-full min-h-full p-4'
                )}
            >
                <div className="lumo-insight-card__label mb-1 flex justify-space-between lumo-label-small lumo-color-glyph-mid">
                    <span dir="auto">{spec.title}</span>
                </div>
                <div dir="auto" className="lumo-insight-card__value mt-1 lumo-color-glyph">
                    {spec.value}
                </div>
                {spec.delta ? (
                    <div
                        className={clsx(
                            'lumo-insight-card__delta flex items-center gap-1 mt-2 lumo-label-small',
                            `lumo-insight-card__delta--${direction}`
                        )}
                    >
                        <span>{deltaPrefix(direction)}</span>
                        <span dir="auto">{spec.delta}</span>
                    </div>
                ) : null}
            </div>
        );
    }

    const isFinding = spec.type === 'finding';
    const showTitle = spec.title.trim().length > 0;

    return (
        <div
            className={clsx(
                LUMO_MARKDOWN_CARD_SHELL_CLASS,
                'lumo-insight-card p-4',
                isFinding && 'lumo-insight-card--finding',
                isFinding && severityClass(spec.severity)
            )}
        >
            {showTitle ? (
                <div className="lumo-insight-card__label mb-1 flex justify-space-between lumo-label-small lumo-color-glyph-mid">
                    <span dir="auto">{spec.title}</span>
                    {isFinding ? <span>{spec.severity ?? 'info'}</span> : null}
                </div>
            ) : null}
            <div dir="auto" className="lumo-insight-card__body mt-2 lumo-body-small lumo-color-glyph-mid">
                {spec.body}
            </div>
            {spec.tags && spec.tags.length > 0 ? (
                <>
                    <hr className="lumo-insight-card__divider my-3 mx-0" />
                    <div className="lumo-insight-card__tags flex flex-wrap gap-1.5">
                        {spec.tags.map((tag) => (
                            <span
                                key={tag}
                                dir="auto"
                                className="lumo-insight-card__tag lumo-bg-control-fill border radius-full lumo-label-small lumo-color-glyph"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
};
