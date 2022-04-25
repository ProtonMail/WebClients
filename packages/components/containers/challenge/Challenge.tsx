import { useRef, useState } from 'react';
import { randomIntFromInterval } from '@proton/shared/lib/helpers/function';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';

import { classnames } from '../../helpers';
import { Loader } from '../../components/loader';

import ChallengeFrame, { Props as ChallengeProps } from './ChallengeFrame';
import ChallengeError from './ChallengeError';
import { ChallengeLog } from './interface';

interface Props extends Omit<ChallengeProps, 'src' | 'onError' | 'onSuccess'> {
    type: number;
    name: string;
    iframeClassName?: string;
    noLoader?: boolean;
    onSuccess: (challengeLog: ChallengeLog[]) => void;
    onError: (challengeLog: ChallengeLog[]) => void;
}

const Challenge = ({
    children,
    style,
    onSuccess,
    onError,
    noLoader,
    bodyClassName,
    iframeClassName,
    loaderClassName,
    name,
    type,
    ...rest
}: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorRetry, setErrorRetry] = useState(0);
    const challengeLogRef = useRef<ChallengeLog[]>([]);

    const challengeSrc = (() => {
        const url = getApiSubdomainUrl('/challenge/v4/html');
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

    return (
        <>
            {isLoading && !noLoader ? <Loader className={loaderClassName} /> : null}

            {hasError ? (
                <ChallengeError />
            ) : (
                <ChallengeFrame
                    key={errorRetry}
                    src={challengeSrc}
                    errorTimeout={errorTimeout}
                    className={iframeClassName ? iframeClassName : 'w100'}
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
        </>
    );
};

export default Challenge;
