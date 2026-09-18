import { useState } from 'react';

import type { Props as ChallengeProps } from '@proton/challenge/v4/Challenge';
import Challenge from '@proton/challenge/v4/Challenge';
import { CHALLENGE_PATHNAME, getChallengeSrc } from '@proton/challenge/v4/getChallengeSrc';
import useRightToLeft from '@proton/hooks/useRightToLeft';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';

import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';
import ChallengeError from './ChallengeError';

interface Props extends Omit<ChallengeProps, 'getSrc' | 'className' | 'breakpointClassName'> {
    type: number;
    name: string;
    iframeClassName?: string;
}

/**
 * The v4 frame wired into this app: resolves the API url, mirrors the viewport and the text
 * direction, and renders the error state. The frame itself lives in `@proton/challenge`.
 */
const ChallengeV4 = ({ onError, iframeClassName, name, type, ...rest }: Props) => {
    const [error, setError] = useState(false);
    const [isRTL] = useRightToLeft();
    const breakpoints = useActiveBreakpoint();

    if (error) {
        if (rest.empty) {
            return null;
        }
        return <ChallengeError />;
    }

    return (
        <Challenge
            getSrc={(retry) =>
                getChallengeSrc(getApiSubdomainUrl(CHALLENGE_PATHNAME, window.location.origin), {
                    type,
                    name,
                    lang: document.documentElement.lang,
                    dir: isRTL ? 'rtl' : 'ltr',
                    retry,
                })
            }
            className={iframeClassName}
            breakpointClassName={breakpoints.activeBreakpoint}
            onError={(challengeLog) => {
                setError(true);
                onError?.(challengeLog);
            }}
            {...rest}
        />
    );
};

export default ChallengeV4;
