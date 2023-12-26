import { useRef, useState } from 'react';

import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import ChallengeError from './ChallengeError';
import ChallengeFrame, { Props as ChallengeProps } from './ChallengeFrame';
import { ChallengeLog } from './interface';

interface Props extends Omit<ChallengeProps, 'src' | 'onError' | 'onSuccess'> {
    type: number;
    name: string;
    iframeClassName?: string;
    onSuccess: (challengeLog: ChallengeLog[]) => void;
    onError: (challengeLog: ChallengeLog[]) => void;
}

const Challenge = ({
    children,
    style,
    onSuccess,
    onError,
    bodyClassName,
    iframeClassName,
    name,
    type,
    ...rest
}: Props) => {
    const [error, setError] = useState(false);
    const [errorRetry, setErrorRetry] = useState(0);
    const challengeLogRef = useRef<ChallengeLog[]>([]);

    const challengeSrc = (() => {
        const url = getApiSubdomainUrl('/challenge/v4/html', window.location.origin);
        url.searchParams.set('Type', `${type}`);
        url.searchParams.set('Name', name);
        if (errorRetry) {
            url.searchParams.set('Retry', `${errorRetry}`);
        }
        return url.toString();
    })();

    // Loading error timeouts in intervals of [12, 15], [17, 20], [22, 25]
    const jitter = randomIntFromInterval(0, 3);
    const errorTimeout = (15 + errorRetry * 5 - jitter) * 1000;

    if (error) {
        if (rest.empty) {
            return null;
        }
        return <ChallengeError />;
    }

    return (
        <ChallengeFrame
            key={errorRetry}
            src={challengeSrc}
            errorTimeout={errorTimeout}
            className={iframeClassName ? iframeClassName : 'w-full'}
            bodyClassName={bodyClassName}
            style={style}
            onSuccess={() => {
                onSuccess?.(challengeLogRef.current);
            }}
            onError={(challengeLog) => {
                challengeLogRef.current = challengeLogRef.current.concat(challengeLog);
                if (errorRetry < 2) {
                    setErrorRetry(errorRetry + 1);
                    return;
                }
                setError(true);
                onError?.(challengeLogRef.current);
            }}
            {...rest}
        >
            {children}
        </ChallengeFrame>
    );
};

export default Challenge;
