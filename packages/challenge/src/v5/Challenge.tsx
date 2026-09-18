import { useChallengeRetry } from '../shared/useChallengeRetry';
import type { Props as ChallengeFrameProps } from './ChallengeFrame';
import ChallengeFrame from './ChallengeFrame';
import type { ChallengeLog } from './interface';

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
    const { failed, retry, errorTimeout, handleSuccess, handleError } = useChallengeRetry({ onSuccess, onError });

    const src = getSrc(retry);

    if (failed) {
        return null;
    }

    return (
        <ChallengeFrame
            key={`${retry}:${src}`}
            src={src}
            errorTimeout={errorTimeout}
            onSuccess={handleSuccess}
            onError={handleError}
            {...rest}
        />
    );
};

export default Challenge;
