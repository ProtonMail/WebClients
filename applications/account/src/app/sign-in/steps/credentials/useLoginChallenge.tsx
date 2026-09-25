import { useCallback, useRef } from 'react';

import { useStaticExperiment } from '@proton/account/staticExperiments/useStaticExperiment';
import type { ChallengeResult } from '@proton/challenge/interface';
import type { ChallengeRef as ChallengeV4Ref } from '@proton/challenge/v4/interface';
import ChallengeV5 from '@proton/challenge/v5/Challenge';
import { CHALLENGE_PATHNAME, getChallengeSrc } from '@proton/challenge/v5/getChallengeSrc';
import type { ChallengeRef as ChallengeV5Ref } from '@proton/challenge/v5/interface';
import ChallengeV4 from '@proton/components/containers/challenge/ChallengeV4';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

/**
 * The anti-abuse challenge for the sign-in form, V4 or V5 depending on the experiment.
 * Keep `element` mounted for the whole form, across credentials modes: it collects data while the user types.
 * Attach `usernameRef` to the current form's username input.
 */
export const useLoginChallenge = () => {
    const challengeV4Ref = useRef<ChallengeV4Ref>();
    const challengeV5Ref = useRef<ChallengeV5Ref>();
    const usernameInputRef = useRef<HTMLInputElement | null>(null);
    const isV5 = useStaticExperiment('ChallengeV5') === 'v5';

    // The forms own their fields' state, so the input mounts and changes without re-rendering the frame, which only
    // reads `observeRef` when it renders. The callback ref tells it directly; `observeRef` covers a frame that
    // remounts on retry after the input is there.
    const usernameRef = useCallback((el: HTMLInputElement | null) => {
        usernameInputRef.current = el;
        challengeV5Ref.current?.observe(el);
    }, []);

    const element = isV5 ? (
        <ChallengeV5
            challengeRef={challengeV5Ref}
            observeRef={usernameInputRef}
            getSrc={(retry) =>
                getChallengeSrc(getApiSubdomainUrl(CHALLENGE_PATHNAME, window.location.origin), {
                    type: 0,
                    name: 'login',
                    lang: document.documentElement.lang,
                    retry,
                })
            }
        />
    ) : (
        <ChallengeV4 empty tabIndex={-1} challengeRef={challengeV4Ref} type={0} name="login" />
    );

    /** Only one of the two frames is mounted, so ask whichever it is. A failing challenge doesn't block sign-in. */
    const getPayload = async (): Promise<ChallengeResult> => {
        const ref = isV5 ? challengeV5Ref : challengeV4Ref;
        return (await ref.current?.getChallenge().catch(noop)) ?? undefined;
    };

    return { element, usernameRef, getPayload };
};
