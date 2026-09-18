import type { CSSProperties, MutableRefObject, RefObject } from 'react';
import { useLayoutEffect, useRef } from 'react';

import ChallengeFrameController from './ChallengeFrameController';
import type { ChallengeLog, ChallengeRef } from './interface';

/**
 * Off-screen, not display:none, as hidden iframes can be throttled or slow to load.
 */
const hiddenStyle: CSSProperties = {
    position: 'absolute',
    top: '-10000px',
    left: '-10000px',
    width: '1px',
    height: '1px',
    border: 0,
};

export interface Props {
    challengeRef: MutableRefObject<ChallengeRef | undefined>;
    /**
     * Subtree to watch. Read on every render, so the element may appear or change after mount.
     * Other fields can use `sendEvent`.
     */
    observeRef?: RefObject<HTMLElement | null>;
    /** Fixed for this mount; `Challenge` remounts on `key={src}` when the URL changes. */
    src: string;
    onError?: (logs: ChallengeLog[]) => void;
    onSuccess?: () => void;
    errorTimeout?: number;
    challengeTimeout?: number;
}

/**
 * Loads the sandboxed challenge frame and feeds it the user's interactions.
 *
 * Here the form is rendered normally wherever it belongs, this component only watches it, and only
 * the events cross over. The protocol itself lives in `ChallengeFrameController`; this renders the
 * iframe and ties the controller's lifetime to the component's.
 *
 * Not exported from the package: use `Challenge` so `src` stays fixed for the controller's lifetime.
 */
const ChallengeFrame = ({
    onSuccess,
    onError,
    challengeRef,
    observeRef,
    src,
    errorTimeout,
    challengeTimeout,
}: Props) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const controllerRef = useRef<ChallengeFrameController>();

    const callbacksRef = useRef({ onSuccess, onError });
    callbacksRef.current = { onSuccess, onError };

    useLayoutEffect(() => {
        const controller = new ChallengeFrameController({
            iframe: iframeRef.current!,
            src,
            errorTimeout,
            challengeTimeout,
            onSuccess: () => callbacksRef.current.onSuccess?.(),
            onError: (logs) => callbacksRef.current.onError?.(logs),
        });

        controllerRef.current = controller;
        challengeRef.current = controller;

        return () => {
            controllerRef.current = undefined;
            // Don't leave the caller holding a handle to a destroyed controller — its getChallenge
            // would reject with 'Challenge unmounted' and nothing else. Only clear it if it is
            // still ours: a keyed remount may already have put its own controller there.
            if (challengeRef.current === controller) {
                challengeRef.current = undefined;
            }
            controller.destroy();
        };
    }, []);

    useLayoutEffect(() => {
        controllerRef.current?.observe(observeRef?.current);
    });

    return (
        <iframe
            src={src}
            ref={iframeRef}
            // Hidden from assistive tech and out of the tab order; the title is only here because an
            // iframe is required to carry one.
            title="Challenge"
            tabIndex={-1}
            aria-hidden="true"
            sandbox="allow-scripts allow-same-origin allow-popups"
            style={hiddenStyle}
        />
    );
};

export default ChallengeFrame;
