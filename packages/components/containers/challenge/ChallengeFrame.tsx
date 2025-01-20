import type { DetailedHTMLProps, IframeHTMLAttributes, MutableRefObject, ReactNode } from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import clsx from '@proton/utils/clsx';

import { getStyleSrcUrls, getStyleSrcsData, handleEvent } from './challengeHelper';
import type { ChallengeLog, ChallengeLogType, ChallengeRef, ChallengeResult } from './interface';

export const ERROR_TIMEOUT_MS = 15000;
export const CHALLENGE_TIMEOUT_MS = ERROR_TIMEOUT_MS + 9000;

type Stage = 'initialize' | 'initialized' | 'load' | 'loaded' | 'error';

export interface Props
    extends Omit<DetailedHTMLProps<IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>, 'onClick' | 'onError'> {
    challengeRef: MutableRefObject<ChallengeRef | undefined>;
    children?: ReactNode;
    src: string;
    getThemeData?: () => string | undefined;
    getIconsData?: () => string | undefined;
    className?: string;
    empty?: boolean;
    bodyClassName?: string;
    hasSizeObserver?: boolean;
    title?: string;
    onError?: (logs: ChallengeLog[]) => void;
    onSuccess?: () => void;
    errorTimeout?: number;
    challengeTimeout?: number;
}

const ChallengeFrame = ({
    onSuccess,
    onError,
    title,
    children,
    className,
    empty,
    bodyClassName = '',
    challengeRef,
    src,
    getIconsData,
    getThemeData,
    hasSizeObserver,
    errorTimeout = ERROR_TIMEOUT_MS,
    challengeTimeout = CHALLENGE_TIMEOUT_MS,
    ...rest
}: Props) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isRendered, setIsRendered] = useState(false);
    const renderDivRef = useRef<HTMLDivElement>(null);
    const breakpoints = useActiveBreakpoint();
    const [iframeHeight, setIframeHeight] = useState(0);

    const targetOrigin = useMemo(() => {
        return new URL(src).origin;
    }, [src]);

    useLayoutEffect(() => {
        let isMounted = true;
        let mutationObserver: MutationObserver | undefined;
        let domHandle: number | undefined;

        let stage: Stage = 'initialize';
        const setStage = (newStage: Stage) => {
            stage = newStage;
        };

        const logs: ChallengeLog[] = [];
        const tmpUrl = new URL(src);
        const addLog = (text: string, data: unknown, type: ChallengeLogType) => {
            // To keep it somewhat limited
            if (logs.length > 20) {
                return;
            }
            const log: ChallengeLog = {
                type,
                text: `${new Date().toISOString()} ${text} ${tmpUrl.searchParams.toString()}`,
            };
            // The sentry serializer doesn't like undefined values
            if (data) {
                log.data = data;
            }
            logs.push(log);
        };

        let error = false;
        const handleError = () => {
            // If already notified
            if (error) {
                return;
            }
            error = true;
            setStage('error');
            if (!isMounted) {
                return;
            }
            onError?.(logs);
        };

        let errorTimeoutHandle = window.setTimeout(() => {
            addLog('Initial iframe timeout', undefined, 'error');
            handleError();
        }, errorTimeout);

        let challengeResolve: ((data: { [key: string]: string }) => void) | undefined;
        let challengeReject: ((error: any) => void) | undefined;
        let challengeTimeoutHandle: number | undefined;

        const startDOMUpdates = () => {
            const contentWindow = iframeRef.current?.contentWindow;
            const renderDivEl = renderDivRef.current!;

            if (!contentWindow || empty) {
                return;
            }

            const sendUpdate = () => {
                contentWindow.postMessage(
                    {
                        type: 'html',
                        payload: `<div class='${breakpoints.activeBreakpoint}'>${renderDivEl.innerHTML}</div>`,
                    },
                    targetOrigin
                );
            };

            mutationObserver = new MutationObserver(() => {
                sendUpdate();
            });

            mutationObserver.observe(renderDivEl, {
                childList: true,
                subtree: true,
                attributes: true,
            });

            const rect = renderDivEl.getBoundingClientRect();
            setIframeHeight(rect.height);
            sendUpdate();
        };

        const requestChallenge = () => {
            const iframe = iframeRef.current;
            const contentWindow = iframe?.contentWindow;
            if (!contentWindow) {
                return;
            }
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
        };

        const handleLoaded = () => {
            if (!isMounted) {
                return;
            }
            startDOMUpdates();
            // Small timeout to ensure the iframe has received the html
            domHandle = window.setTimeout(() => {
                onSuccess?.();
                setIsRendered(true);
            }, 33);
            if (challengeResolve) {
                requestChallenge();
            }
        };

        const stylesPromise = empty ? Promise.resolve('') : getStyleSrcsData(getStyleSrcUrls());

        const cb = (event: MessageEvent) => {
            const iframe = iframeRef.current;
            const contentWindow = iframe?.contentWindow;
            if (
                error ||
                !iframe ||
                !contentWindow ||
                event.origin !== targetOrigin ||
                event.source !== contentWindow ||
                !isMounted
            ) {
                return;
            }

            const eventData = event.data;
            const eventDataType = eventData?.type;
            const eventDataPayload = eventData?.payload;

            if (eventDataType === 'init' && stage === 'initialize') {
                clearTimeout(errorTimeoutHandle);
                setStage('initialized');
                addLog('Initialized', undefined, 'step');

                stylesPromise
                    .then((styles) => {
                        if (!isMounted) {
                            return;
                        }

                        clearTimeout(errorTimeoutHandle);
                        errorTimeoutHandle = window.setTimeout(() => {
                            addLog('Load iframe error', undefined, 'error');
                            handleError();
                        }, errorTimeout);

                        const themeNodeData = empty ? '' : getThemeData?.();
                        const iconsNodeData = empty ? '' : getIconsData?.();

                        setStage('load');

                        contentWindow.postMessage(
                            {
                                type: 'load',
                                payload: {
                                    iconsRoot: iconsNodeData || '',
                                    stylesRoot: `${styles}\n${themeNodeData || ''}`,
                                    hasSizeObserver,
                                    bodyClassName,
                                },
                            },
                            targetOrigin
                        );
                    })
                    .catch((error) => {
                        addLog('CSS load error', { error }, 'error');
                        handleError();
                    });
            }

            if (eventDataType === 'onload' && stage === 'load') {
                clearTimeout(errorTimeoutHandle);
                setStage('loaded');
                addLog('Fully loaded', undefined, 'step');
                handleLoaded();
            }

            if (eventDataType === 'onerror') {
                addLog('Script error', { error: eventDataPayload }, 'message');
            }

            if (eventDataType === 'event' && stage === 'loaded' && renderDivRef.current) {
                handleEvent(renderDivRef.current, eventDataPayload);
            }

            if (eventDataType === 'rect' && stage === 'loaded' && eventDataPayload?.height !== undefined) {
                setIframeHeight(eventDataPayload.height);
            }

            if (eventDataType === 'child.message.data' && stage === 'loaded') {
                const messageData = eventData.data;
                if (!messageData || !challengeResolve) {
                    return;
                }
                clearTimeout(challengeTimeoutHandle);
                challengeResolve({
                    [messageData.id]: messageData.fingerprint,
                });
                challengeReject = undefined;
                challengeResolve = undefined;
            }
        };

        challengeRef.current = {
            focus: (selector: string) => {
                const contentWindow = iframeRef.current?.contentWindow;
                if (!contentWindow || stage !== 'loaded') {
                    return;
                }
                contentWindow.postMessage(
                    {
                        type: 'focus',
                        payload: {
                            selector,
                        },
                    },
                    targetOrigin
                );
            },
            getChallenge: () => {
                if (challengeReject) {
                    challengeReject(new Error('Challenge abandoned'));
                }
                clearTimeout(challengeTimeoutHandle);
                return new Promise<ChallengeResult | undefined>((resolve, reject) => {
                    challengeResolve = resolve;
                    challengeReject = reject;
                    if (stage === 'loaded') {
                        requestChallenge();
                    }
                    challengeTimeoutHandle = window.setTimeout(() => {
                        reject(new Error('Challenge timeout'));
                    }, challengeTimeout);
                });
            },
        };

        addLog('Added listener', undefined, 'step');

        window.addEventListener('message', cb);
        return () => {
            window.removeEventListener('message', cb);
            clearTimeout(errorTimeoutHandle);
            clearTimeout(challengeTimeoutHandle);
            clearTimeout(domHandle);
            isMounted = false;
            mutationObserver?.disconnect();
            challengeReject?.(new Error('Challenge unmounted'));
        };
    }, []);

    const hiddenProps = {
        style: {
            '--left-custom': '-1000px',
            '--top-custom': '-1000px',
        },
        ['aria-hidden']: true,
        className: 'absolute top-custom left-custom',
    };

    const divProps =
        isRendered || empty
            ? {
                  ...hiddenProps,
                  className: `${hiddenProps.className} visibility-hidden`,
              }
            : undefined;

    const iframeProps = empty
        ? hiddenProps
        : {
              // We don't render the iframe off-screen to prevent fouc
              className: clsx(className, 'h-custom', !isRendered && 'absolute visibility-hidden'),
              style: {
                  ['--h-custom']: `${iframeHeight}px`,
              },
          };

    return (
        <>
            <div ref={renderDivRef} {...divProps}>
                {children}
            </div>
            <iframe
                {...rest}
                src={src}
                ref={iframeRef}
                title={title}
                sandbox="allow-scripts allow-same-origin allow-popups"
                {...iframeProps}
            />
        </>
    );
};

export default ChallengeFrame;
