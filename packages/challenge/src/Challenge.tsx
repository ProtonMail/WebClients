import { useMemo, useRef, useState } from 'react';

import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import type { Props as ChallengeFrameProps } from './ChallengeFrame';
import ChallengeFrame from './ChallengeFrame';
import type { ChallengeLog } from './interface';

const MAX_RETRIES = 2;

export interface Props extends Omit<ChallengeFrameProps, 'src' | 'onError' | 'onSuccess'> {
    /**
     * Builds the frame URL for a given attempt. Called again on every retry, so the `retry`
     * parameter can be folded into the URL (see `getChallengeSrc`).
     */
    getSrc: (retry: number) => string;
    onSuccess?: (challengeLog: ChallengeLog[]) => void;
    /** Called once the last retry has failed. This package renders no error UI. */
    onError?: (challengeLog: ChallengeLog[]) => void;
}

/**
 * `ChallengeFrame` plus the reload-on-failure behaviour.
 */
const Challenge = ({ onSuccess, onError, getSrc, ...rest }: Props) => {
    const [failed, setFailed] = useState(false);
    const [errorRetry, setErrorRetry] = useState(0);
    const challengeLogRef = useRef<ChallengeLog[]>([]);

    const src = getSrc(errorRetry);

    // Drawn once per attempt rather than per render: `ChallengeFrame` reads the attempt's timeout
    // when it mounts.
    // Loading error timeouts in intervals of [12, 15], [17, 20], [22, 25]
    const errorTimeout = useMemo(() => (15 + errorRetry * 5 - randomIntFromInterval(0, 3)) * 1000, [errorRetry]);

    if (failed) {
        return null;
    }

    return (
        <ChallengeFrame
            key={`${errorRetry}:${src}`}
            src={src}
            errorTimeout={errorTimeout}
            onSuccess={() => {
                onSuccess?.(challengeLogRef.current);
            }}
            onError={(challengeLog) => {
                challengeLogRef.current = challengeLogRef.current.concat(challengeLog);
                if (errorRetry < MAX_RETRIES) {
                    setErrorRetry(errorRetry + 1);
                    return;
                }
                setFailed(true);
                onError?.(challengeLogRef.current);
            }}
            {...rest}
        />
    );
};

export default Challenge;
