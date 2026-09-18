import { useMemo, useRef, useState } from 'react';

import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import type { ChallengeLog } from './interface';

const MAX_RETRIES = 2;

interface ChallengeRetryOptions {
    onSuccess?: (challengeLog: ChallengeLog[]) => void;
    /** Called once the last retry has failed. This package renders no error UI. */
    onError?: (challengeLog: ChallengeLog[]) => void;
}

/** Reloads the frame on failure and reports the logs of every attempt once the last one fails. */
export const useChallengeRetry = ({ onSuccess, onError }: ChallengeRetryOptions) => {
    const [failed, setFailed] = useState(false);
    const [retry, setRetry] = useState(0);
    const challengeLogRef = useRef<ChallengeLog[]>([]);

    // Drawn once per attempt rather than per render: the frame reads the attempt's timeout when it
    // mounts.
    // Loading error timeouts in intervals of [12, 15], [17, 20], [22, 25]
    const errorTimeout = useMemo(() => (15 + retry * 5 - randomIntFromInterval(0, 3)) * 1000, [retry]);

    const handleSuccess = () => {
        onSuccess?.(challengeLogRef.current);
    };

    const handleError = (challengeLog: ChallengeLog[]) => {
        challengeLogRef.current = challengeLogRef.current.concat(challengeLog);
        if (retry < MAX_RETRIES) {
            setRetry(retry + 1);
            return;
        }
        setFailed(true);
        onError?.(challengeLogRef.current);
    };

    return { failed, retry, errorTimeout, handleSuccess, handleError };
};
