import clsx from '@proton/utils/clsx';

import { type RecoveryScoreTone, SCORE_TONE_BG_CLASS } from './recoveryScoreState';

export const RecoveryScoreBar = ({
    score,
    maxScore,
    scoreTone,
    style,
}: {
    score: number;
    maxScore: number;
    scoreTone: RecoveryScoreTone;
    style?: React.CSSProperties;
}) => {
    return (
        <div className="mb-3 flex gap-1 h-custom" style={{ '--h-custom': '0.1875rem', ...style }}>
            {Array.from({ length: maxScore }, (_, index) => (
                <div
                    key={index}
                    className={clsx(
                        'h-full flex-1 rounded-full',
                        index < score ? SCORE_TONE_BG_CLASS[scoreTone] : 'bg-strong'
                    )}
                />
            ))}
        </div>
    );
};
