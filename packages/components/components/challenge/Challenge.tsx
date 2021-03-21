import React, { useState } from 'react';
import { c } from 'ttag';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { traceError } from 'proton-shared/lib/helpers/sentry';

import ChallengeFrame, { Props as ChallengeProps } from './ChallengeFrame';
import { Alert } from '../alert';
import { Href } from '../link';
import { Loader } from '../loader';
import { classnames } from '../../helpers';

const Challenge = ({
    children,
    style,
    onLoaded,
    bodyClassName,
    loaderClassName,
    ...rest
}: Omit<ChallengeProps, 'src'>) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorRetry, setErrorRetry] = useState(0);

    const supportTeam = (
        <Href key="support" url="https://protonmail.com/support-form" title="Contact the ProtonMail support team.">
            {c('Info').t`support team`}
        </Href>
    );

    const handleError = () => {
        traceError(new Error(`Failed to load challenge frame. Retry ${errorRetry}`));
        if (errorRetry < 2) {
            setErrorRetry(errorRetry + 1);
            return;
        }
        setHasError(true);
        setIsLoading(false);
        onLoaded?.();
    };

    const challengeSrc = (() => {
        const base = 'https://secure.protonmail.com/challenge/challenge.html';
        const queryParameters = errorRetry === 0 ? '' : `?retry=${errorRetry}`;
        return `${base}${queryParameters}`;
    })();

    // Loading error timeouts in intervals of [12, 15], [17, 20], [22, 25]
    const jitter = randomIntFromInterval(0, 3);
    const errorTimeout = (15 + errorRetry * 5 - jitter) * 1000;

    return (
        <div style={style}>
            {isLoading ? <Loader className={loaderClassName} /> : null}

            {hasError ? (
                <>
                    <Alert type="error">
                        {c('Error')
                            .jt`Something went wrong, please refresh the page in order to proceed. If you still see this error message please contact our ${supportTeam}.`}
                    </Alert>
                </>
            ) : (
                <ChallengeFrame
                    key={errorRetry}
                    src={challengeSrc}
                    errorTimeout={errorTimeout}
                    className="w100"
                    bodyClassName={classnames(['color-norm bg-norm', bodyClassName])}
                    style={style}
                    onLoaded={() => {
                        setIsLoading(false);
                        onLoaded?.();
                    }}
                    onError={handleError}
                    {...rest}
                >
                    {children}
                </ChallengeFrame>
            )}
        </div>
    );
};

export default Challenge;
