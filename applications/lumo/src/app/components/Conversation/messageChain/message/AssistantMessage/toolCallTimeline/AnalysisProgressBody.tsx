import { useEffect, useState } from 'react';

import { useAnalysisProgress } from '../../../../../../services/analysisProgressStore';
import {
    LINE_INTERVAL_MS,
    getAnalysisCount,
    getAnalysisEffortNote,
    getAnalysisLine,
    seedFromId,
} from './analysisProgressText';

/** While a long file is being read through: how far it has got, with a lighter line to go with it. */
export const AnalysisProgressBody = ({ callId }: { callId?: string }) => {
    const progress = useAnalysisProgress(callId);
    const [tick, setTick] = useState(0);

    const running = !!progress;
    useEffect(() => {
        if (!running) {
            return;
        }
        const timer = setInterval(() => setTick((value) => value + 1), LINE_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [running]);

    if (!progress) {
        return null;
    }
    const { phase, done, total } = progress;
    const count = getAnalysisCount(progress);
    const effort = getAnalysisEffortNote(progress);

    return (
        <div className="thinking-step-body flex flex-column gap-1 min-w-0 mt-0.5" aria-live="off">
            <p className="m-0 flex flex-nowrap items-center justify-space-between gap-2 min-w-0 text-sm lh130">
                {/* Decorative: the step's label already says what is happening, and a line that
                    changes every few seconds would be announced again each time. */}
                <span className="text-ellipsis color-norm" aria-hidden="true">
                    {`🐾 ${getAnalysisLine(progress, tick, seedFromId(callId))}…`}
                </span>
                {count && <span className="color-weak shrink-0">{count}</span>}
            </p>
            <progress
                className="progress-bar progress-bar--norm is-thin w-full"
                // No value while merging: how long that takes is not known.
                value={phase === 'merging' ? undefined : done}
                max={Math.max(total, 1)}
                aria-hidden="true"
            />
            {effort && <p className="m-0 text-sm lh130 color-weak">{effort}</p>}
        </div>
    );
};
