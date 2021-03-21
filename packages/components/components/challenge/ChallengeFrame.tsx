import React, { MutableRefObject, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useConfig } from '../../hooks';
import { getChallengeURL, handleEvent, normalizeSelectOptions } from './challengeHelper';

export const ERROR_TIMEOUT_MS = 15000;
export const CHALLENGE_TIMEOUT_MS = 9000;
export const LAYOUT_SHIFT_TIMEOUT_MS = 50;

export type ChallengeResult = { [key: string]: string } | undefined;

export interface ChallengeRef {
    getChallenge: () => Promise<ChallengeResult>;
}

export interface Props
    extends Omit<React.DetailedHTMLProps<React.IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>, 'onClick'> {
    challengeRef: MutableRefObject<ChallengeRef | undefined>;
    children: React.ReactNode;
    src: string;
    className?: string;
    innerClassName?: string;
    bodyClassName?: string;
    loaderClassName?: string;
    title?: string;
    type: number;
    onError?: () => void;
    onLoaded?: () => void;
    errorTimeout?: number;
    challengeTimeout?: number;
}

const ChallengeFrame = ({
    type,
    onLoaded,
    onError,
    title,
    children,
    className,
    bodyClassName = '',
    innerClassName = '',
    challengeRef,
    src,
    errorTimeout = ERROR_TIMEOUT_MS,
    challengeTimeout = CHALLENGE_TIMEOUT_MS,
    ...rest
}: Props) => {
    const config = useConfig();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const renderDivRef = useRef<HTMLDivElement>(null) as MutableRefObject<HTMLDivElement>;

    const targetOrigin = useMemo(() => {
        return new URL(src).origin;
    }, [src]);

    useLayoutEffect(() => {
        let isMounted = true;
        let callbackHandle: number | undefined;

        renderDivRef.current = document.createElement('DIV') as HTMLDivElement;

        let error = false;
        const handleError = () => {
            error = true;
            if (!isMounted) {
                return;
            }
            onError?.();
        };
        let errorTimeoutHandle = window.setTimeout(handleError, errorTimeout);

        const challengeUrlSrc = getChallengeURL(config.API_URL, type).toString();
        const styleSrcs = [...document.querySelectorAll<HTMLLinkElement>('link[rel=stylesheet]')]
            .map((x) => {
                return new URL(x.href, window.location.origin).toString();
            })
            .filter((url) => {
                return url.startsWith(window.location.origin);
            });
        const scriptSrcs = [challengeUrlSrc];
        let challengeError = false;

        let challengeResolve: (data: { [key: string]: string }) => void;

        // The + 1 is for the style sanity check
        const assetsTotal = scriptSrcs.length + styleSrcs.length + 1;
        let assetsLoaded = 0;

        const handleInitDone = () => {
            clearTimeout(errorTimeoutHandle);
            if (!isMounted) {
                return;
            }
            setIsLoaded(true);
            callbackHandle = window.setTimeout(() => {
                if (!isMounted) {
                    return;
                }
                onLoaded?.();
                // Small timeout to let the iframe render and improve layout shift
            }, LAYOUT_SHIFT_TIMEOUT_MS);
        };

        const handleAssetLoaded = () => {
            if (++assetsLoaded === assetsTotal) {
                handleInitDone();
            }
        };

        const handleAssetError = (src: string) => {
            if (src === challengeUrlSrc) {
                challengeError = true;
                // Treat the challenge misloading as ok
                handleAssetLoaded();
                return;
            }
            // Otherwise it's a CSS error and a hard failure
            handleError();
        };

        /**
         * This check is for catching when a new deployment has happened. Since missing assets fallback
         * to serving index.html, it tries to verify that the actual content is css.
         * So it tries to fetch the CSS again (which should be cached in the browser) and checks the content-type
         * and else the first character.
         */
        const handleStylesSanityCheck = () => {
            Promise.all(
                styleSrcs.map(async (styleSrc) => {
                    const response = await fetch(styleSrc);
                    const contentType = response.headers.get('content-type');
                    if (contentType?.startsWith('text/css')) {
                        return;
                    }
                    const data = (await response.text()).trimStart();
                    if (data.startsWith('<')) {
                        throw new Error('Invalid data');
                    }
                })
            )
                .then(() => {
                    handleAssetLoaded();
                })
                .catch(() => {
                    handleAssetError(styleSrcs[0]);
                });
        };

        handleStylesSanityCheck();

        const cb = (event: MessageEvent) => {
            const contentWindow = iframeRef.current?.contentWindow;
            if (error || !contentWindow || event.origin !== targetOrigin || event.source !== contentWindow) {
                return;
            }

            const eventData = event.data;
            const eventDataType = eventData?.type;
            const eventDataPayload = eventData?.payload;

            if (eventDataType === 'init') {
                if (!contentWindow) {
                    handleError();
                    return;
                }

                clearTimeout(errorTimeoutHandle);
                errorTimeoutHandle = window.setTimeout(handleError, errorTimeout);

                contentWindow.postMessage(
                    {
                        type: 'load',
                        payload: {
                            styles: styleSrcs,
                            scripts: scriptSrcs,
                            bodyClassName,
                        },
                    },
                    targetOrigin
                );
            }

            if (eventDataType === 'rect' && eventDataPayload?.height !== undefined && iframeRef.current) {
                iframeRef.current.style.height = `${eventDataPayload.height}px`;
            }

            if (eventDataType === 'onload') {
                handleAssetLoaded();
            }

            if (eventDataType === 'onerror') {
                handleAssetError(eventDataPayload);
            }

            if (eventDataType === 'event') {
                handleEvent(renderDivRef.current, eventDataPayload);
            }

            if (eventDataType === 'child.message.data') {
                const messageData = eventData.data;
                if (!messageData) {
                    return;
                }
                challengeResolve?.({
                    [messageData.id]: messageData.fingerprint,
                });
            }
        };

        challengeRef.current = {
            getChallenge: () => {
                return new Promise<ChallengeResult | undefined>((resolve, reject) => {
                    if (challengeError) {
                        return resolve(undefined);
                    }
                    const contentWindow = iframeRef.current?.contentWindow;
                    if (!contentWindow) {
                        return reject(new Error('No iframe available'));
                    }
                    challengeResolve = resolve;
                    contentWindow.postMessage(
                        {
                            type: 'env.loaded',
                            data: {
                                targetOrigin: window.location.origin,
                            },
                        },
                        targetOrigin
                    );
                    contentWindow.postMessage(
                        {
                            type: 'submit.broadcast',
                        },
                        targetOrigin
                    );
                    errorTimeoutHandle = window.setTimeout(() => {
                        reject(new Error('Challenge timeout'));
                    }, challengeTimeout);
                });
            },
        };

        window.addEventListener('message', cb);
        return () => {
            window.removeEventListener('message', cb);
            clearTimeout(errorTimeoutHandle);
            clearTimeout(callbackHandle);
            isMounted = false;
        };
    }, []);

    useLayoutEffect(() => {
        const contentWindow = iframeRef.current?.contentWindow;
        const renderEl = renderDivRef.current;
        if (!renderEl || !contentWindow || !isLoaded) {
            return;
        }
        renderEl.className = innerClassName;
        ReactDOM.render(children as any, renderEl, () => {
            normalizeSelectOptions(renderEl);

            contentWindow.postMessage(
                {
                    type: 'html',
                    payload: renderEl.outerHTML,
                },
                targetOrigin
            );
        });
    }, [isLoaded, children, iframeRef.current]);

    return (
        <iframe
            {...rest}
            src={src}
            ref={iframeRef}
            title={title}
            className={className}
            sandbox="allow-scripts allow-same-origin allow-popups"
        />
    );
};

export default ChallengeFrame;
