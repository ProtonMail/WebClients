import { c } from 'ttag';

import type { PhaseResult } from './interface';

export const ResultRow = ({ title, value }: { title: string; value: string }) => {
    return (
        <div className="flex flex-nowrap items-baseline">
            <span className="shrink-0 w-custom" style={{ '--w-custom': '16rem' }}>
                {title}
            </span>
            <span className="color-weak">{value}</span>
        </div>
    );
};

export const PhaseResultRows = ({ title, phase }: { title: string; phase: PhaseResult }) => {
    return (
        <>
            <p className="text-semibold mb-0 mt-2">{title}</p>
            <ResultRow title={c('Label').t`Duration`} value={`${phase.durationMs.toFixed(1)} ms`} />
            <ResultRow
                title={c('Label').t`Dropped frames`}
                value={`${phase.stats.droppedFrames} / ${phase.stats.frames} (worst ${phase.stats.longestFrameMs.toFixed(0)} ms)`}
            />
            <ResultRow
                title={c('Label').t`Long tasks (≥ 50 ms)`}
                value={
                    phase.stats.longTaskApiSupported
                        ? `${phase.stats.longTasks} (worst ${phase.stats.longestLongTaskMs.toFixed(0)} ms, total ${phase.stats.totalLongTaskMs.toFixed(0)} ms)`
                        : c('Info').t`Not supported by this browser`
                }
            />
            {phase.breakdown?.map((entry) => (
                <ResultRow key={entry.label} title={`↳ ${entry.label}`} value={`${entry.durationMs.toFixed(1)} ms`} />
            ))}
        </>
    );
};
