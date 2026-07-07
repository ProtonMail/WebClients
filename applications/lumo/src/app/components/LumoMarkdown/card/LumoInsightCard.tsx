import clsx from 'clsx';

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
            <div className="lumo-insight-card lumo-insight-card--metric">
                <div className="lumo-insight-card__label">
                    <span>{spec.title}</span>
                </div>
                <div className="lumo-insight-card__value">{spec.value}</div>
                {spec.delta ? (
                    <div className={clsx('lumo-insight-card__delta', `lumo-insight-card__delta--${direction}`)}>
                        <span>{deltaPrefix(direction)}</span>
                        <span>{spec.delta}</span>
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
                'lumo-insight-card',
                isFinding && 'lumo-insight-card--finding',
                isFinding && severityClass(spec.severity)
            )}
        >
            {showTitle ? (
                <div className="lumo-insight-card__label">
                    <span>{spec.title}</span>
                    {isFinding ? <span>{spec.severity ?? 'info'}</span> : null}
                </div>
            ) : null}
            <div className="lumo-insight-card__body">{spec.body}</div>
            {spec.tags && spec.tags.length > 0 ? (
                <>
                    <hr className="lumo-insight-card__divider" />
                    <div className="lumo-insight-card__tags">
                        {spec.tags.map((tag) => (
                            <span key={tag} className="lumo-insight-card__tag">
                                {tag}
                            </span>
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
};
