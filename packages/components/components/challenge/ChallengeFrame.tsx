import { MutableRefObject, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as React from 'react';
import { getStyleSrcsData, getStyleSrcUrls, handleEvent } from './challengeHelper';
import { THEME_ID } from '../../containers/themes/ThemeProvider';
import { ICONS_ID } from '../icon/Icons';
import { ChallengeLog, ChallengeLogType, ChallengeRef, ChallengeResult } from './interface';

export const ERROR_TIMEOUT_MS = 15000;
export const CHALLENGE_TIMEOUT_MS = 9000;

type Stage = 'initialize' | 'initialized' | 'load' | 'loaded' | 'error';

export interface Props
    extends Omit<
        React.DetailedHTMLProps<React.IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>,
        'onClick' | 'onError'
    > {
    challengeRef: MutableRefObject<ChallengeRef | undefined>;
    children?: React.ReactNode;
    src: string;
    className?: string;
    bodyClassName?: string;
    loaderClassName?: string;
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
    bodyClassName = '',
    challengeRef,
    src,
    hasSizeObserver,
    errorTimeout = ERROR_TIMEOUT_MS,
    challengeTimeout = CHALLENGE_TIMEOUT_MS,
    ...rest
}: Props) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const renderDivRef = useRef<HTMLDivElement>(null);

    const targetOrigin = useMemo(() => {
        return new URL(src).origin;
    }, [src]);

    useLayoutEffect(() => {
        let isMounted = true;

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

        let challengeResolve: (data: { [key: string]: string }) => void;

        const handleLoaded = () => {
            if (!isMounted) {
                return;
            }
            setIsLoaded(true);
            onSuccess?.();
        };

        const themeNodeData = document.querySelector(`#${THEME_ID}`)?.innerHTML ?? '';
        const iconsNodeData = document.querySelector(`#${ICONS_ID}`)?.innerHTML ?? '';
        const stylesPromise = getStyleSrcsData(getStyleSrcUrls());

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
                iframe.style.height = `0px`;

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

                        setStage('load');
                        addLog(
                            'Sending data',
                            [themeNodeData, styles, iconsNodeData].map((x) => x.slice(0, 30)).join(' - '),
                            'step'
                        );

                        contentWindow.postMessage(
                            {
                                type: 'load',
                                payload: {
                                    iconsRoot: `${iconsNodeData}`,
                                    stylesRoot: `${styles}\n${themeNodeData}`,
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
                iframe.style.height = `${eventDataPayload.height}px`;
            }

            if (eventDataType === 'child.message.data' && stage === 'loaded') {
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
                return new Promise<ChallengeResult | undefined>((resolve, reject) => {
                    const contentWindow = iframeRef.current?.contentWindow;
                    if (!contentWindow || stage !== 'loaded') {
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

        addLog('Added listener', undefined, 'step');

        window.addEventListener('message', cb);
        return () => {
            window.removeEventListener('message', cb);
            clearTimeout(errorTimeoutHandle);
            isMounted = false;
        };
    }, []);

    useLayoutEffect(() => {
        const contentWindow = iframeRef.current?.contentWindow;
        const renderDivEl = renderDivRef.current;
        if (!renderDivEl || !contentWindow || !isLoaded) {
            return;
        }
        if (iframeRef.current && !hasSizeObserver) {
            iframeRef.current.style.height = `${renderDivEl.getBoundingClientRect().height}px`;
        }
        contentWindow.postMessage(
            {
                type: 'html',
                payload: `<div>${renderDivEl.innerHTML}</div>`,
            },
            targetOrigin
        );
    }, [isLoaded, children, iframeRef.current, renderDivRef.current]);

    return (
        <>
            <div
                ref={renderDivRef}
                style={{ position: 'absolute', left: '-1000px', top: '-1000px' }}
                aria-hidden="true"
                className="visibility-hidden"
            >
                {children}
            </div>
            <iframe
                {...rest}
                src={src}
                ref={iframeRef}
                title={title}
                className={className}
                sandbox="allow-scripts allow-same-origin allow-popups"
            />
        </>
    );
};

export default ChallengeFrame;
