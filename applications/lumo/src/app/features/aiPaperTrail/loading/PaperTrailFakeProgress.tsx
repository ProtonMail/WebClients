import { useEffect, useState } from 'react';

import { c } from 'ttag';

/** Cosmetic milestones — never reaches 100% until the real report replaces this screen. */
const FAKE_PROGRESS_STEPS = [
    { percent: 10, delayMs: 0 },
    { percent: 25, delayMs: 4000 },
    { percent: 50, delayMs: 10000 },
    { percent: 75, delayMs: 16000 },
    { percent: 99, delayMs: 26000 },
] as const;

const useFakeProgress = (): number => {
    const [progress, setProgress] = useState<number>(FAKE_PROGRESS_STEPS[0].percent);

    useEffect(() => {
        const timeouts = FAKE_PROGRESS_STEPS.map(({ percent, delayMs }) => {
            return setTimeout(() => {
                setProgress(percent);
            }, delayMs);
        });

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, []);

    return progress;
};

export const PaperTrailFakeProgress = () => {
    const progress = useFakeProgress();

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            className="ai-paper-trail__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={c('collider_2025:Label').t`Generating your report`}
        >
            <div className="ai-paper-trail__progress-head">
                <span className="ai-paper-trail__progress-label">{c('collider_2025:Label').t`Generating`}</span>
                <span className="ai-paper-trail__progress-value">{progress}%</span>
            </div>
            <div className="ai-paper-trail__progress-track">
                <div className="ai-paper-trail__progress-fill" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
};
