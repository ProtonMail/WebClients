import React, { useRef, useState } from 'react';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { getRelativeApiHostname } from 'proton-shared/lib/helpers/url';

import { classnames } from '../../helpers';
import { useConfig } from '../../hooks';
import { Loader } from '../loader';

import ChallengeFrame, { Props as ChallengeProps } from './ChallengeFrame';
import ChallengeError from './ChallengeError';
import { ChallengeLog } from './interface';

interface Props extends Omit<ChallengeProps, 'src' | 'onError' | 'onSuccess'> {
    type: number;
    onSuccess: (challengeLog: ChallengeLog[]) => void;
    onError: (challengeLog: ChallengeLog[]) => void;
}

const Challenge = ({ children, style, onSuccess, onError, bodyClassName, loaderClassName, type, ...rest }: Props) => {
    const config = useConfig();

    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorRetry, setErrorRetry] = useState(0);
    const challengeLogRef = useRef<ChallengeLog[]>([]);

    const challengeSrc = (() => {
        const url = new URL(config.API_URL, window.location.origin);
        url.hostname = getRelativeApiHostname(url.hostname);
        url.pathname = '/challenge/v4/html';
        url.searchParams.set('Type', `${type}`);
        if (errorRetry) {
            url.searchParams.set('Retry', `${errorRetry}`);
        }
        return url.toString();
    })();

    // Loading error timeouts in intervals of [12, 15], [17, 20], [22, 25]
    const jitter = randomIntFromInterval(0, 3);
    const errorTimeout = (15 + errorRetry * 5 - jitter) * 1000;

    return (
        <div style={style}>
            {isLoading ? <Loader className={loaderClassName} /> : null}

            {hasError ? (
                <ChallengeError />
            ) : (
                <ChallengeFrame
                    key={errorRetry}
                    src={challengeSrc}
                    errorTimeout={errorTimeout}
                    className="w100"
                    bodyClassName={classnames(['color-norm bg-norm', bodyClassName])}
                    style={style}
                    onSuccess={() => {
                        setIsLoading(false);
                        onSuccess?.(challengeLogRef.current);
                    }}
                    onError={(challengeLog) => {
                        challengeLogRef.current = challengeLogRef.current.concat(challengeLog);
                        if (errorRetry < 2) {
                            setErrorRetry(errorRetry + 1);
                            return;
                        }
                        setHasError(true);
                        setIsLoading(false);
                        onError?.(challengeLogRef.current);
                    }}
                    {...rest}
                >
                    {children}
                </ChallengeFrame>
            )}
        </div>
    );
};

export default Challenge;
