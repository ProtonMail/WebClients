import { useCallback, useRef } from 'react';

import type { ChallengeResult } from '@proton/challenge/interface';
import Challenge from '@proton/challenge/v5/Challenge';
import { CHALLENGE_PATHNAME, getChallengeSrc } from '@proton/challenge/v5/getChallengeSrc';
import type { ChallengeRef } from '@proton/challenge/v5/interface';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

/**
 * The anti-abuse challenge for the sign-in form.
 * Keep `element` mounted for the whole form, across credentials modes: it collects data while the user types.
 * Attach `usernameRef` to the current form's username input.
 */
export const useLoginChallenge = () => {
    const challengeRef = useRef<ChallengeRef>();
    const usernameInputRef = useRef<HTMLInputElement | null>(null);

    // The forms own their fields' state, so the input mounts and changes without re-rendering the frame, which only
    // reads `observeRef` when it renders. The callback ref tells it directly; `observeRef` covers a frame that
    // remounts on retry after the input is there.
    const usernameRef = useCallback((el: HTMLInputElement | null) => {
        usernameInputRef.current = el;
        challengeRef.current?.observe(el);
    }, []);

    const element = (
        <Challenge
            challengeRef={challengeRef}
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
    );

    const getPayload = async (): Promise<ChallengeResult> => {
        return (await challengeRef.current?.getChallenge().catch(noop)) ?? undefined;
    };

    return { element, usernameRef, getPayload };
};
