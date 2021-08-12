import React, { useEffect, useState, useRef, MutableRefObject, useImperativeHandle } from 'react';
import { getRelativeApiHostname } from '@proton/shared/lib/helpers/url';
import { useConfig } from '../../hooks';

// The sizes for these are hardcoded since the widget calculates it based on the viewport, and since it's in
// an iframe it needs to have something reasonable.
// The main chat widget.
const OPENED_SIZE = {
    height: `${572 / 16}rem`,
    width: `${374 / 16}rem`,
};
// The small button to toggle the chat.
const CLOSED_SIZE = {
    height: `${70 / 16}rem`,
    width: `${140 / 16}rem`,
};

const getIframeUrl = (apiUrl: string, zendeskKey: string) => {
    const url = new URL(apiUrl, window.location.origin);
    url.hostname = getRelativeApiHostname(url.hostname);
    url.pathname = '/core/v4/resources/zendesk';
    url.searchParams.set('Key', zendeskKey);
    return url;
};

export interface ZendeskRef {
    run: (data: object) => void;
    show: () => void;
}

interface Props {
    zendeskKey: string;
    zendeskRef?: MutableRefObject<ZendeskRef | undefined>;
    name?: string;
    email?: string;
    onLoaded: () => void;
    locale: string;
}

const LiveChatZendesk = ({ zendeskKey, zendeskRef, name, email, onLoaded, locale }: Props) => {
    const { API_URL } = useConfig();
    const [style, setStyle] = useState({
        position: 'absolute',
        bottom: 0,
        right: 0,
        maxHeight: '100%',
        maxWidth: '100%',
        ...CLOSED_SIZE,
    });
    const [state, setState] = useState({ loaded: false, connected: false });
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const pendingLoadingRef = useRef<{ show?: boolean; locale?: string }>({});

    const iframeUrl = getIframeUrl(API_URL, zendeskKey);

    const src = iframeUrl.toString();
    const targetOrigin = iframeUrl.origin;

    const handleRun = (args: any) => {
        const contentWindow = iframeRef.current?.contentWindow;
        if (!contentWindow || !state.loaded) {
            return;
        }
        contentWindow.postMessage({ args }, targetOrigin);
    };

    const handleShow = () => {
        pendingLoadingRef.current.show = true;
        handleRun(['webWidget', 'toggle']);
    };

    useImperativeHandle(zendeskRef, () => ({
        run: handleRun,
        show: handleShow,
    }));

    useEffect(() => {
        if (!state.loaded) {
            return;
        }
        handleRun([
            'webWidget',
            'prefill',
            {
                name: { value: name, readOnly: true },
                email: { value: email, readOnly: true },
            },
        ]);
    }, [state.loaded, name, email]);

    useEffect(() => {
        if (!state.loaded) {
            return;
        }
        handleRun(['webWidget', 'setLocale', locale]);
    }, [state.loaded, locale]);

    useEffect(() => {
        if (!state.loaded || !pendingLoadingRef.current) {
            return;
        }
        const oldPending = pendingLoadingRef.current;
        pendingLoadingRef.current = {};
        if (oldPending.show) {
            handleShow();
        }
    }, [state.loaded]);

    useEffect(() => {
        let globalId = 1;
        const handlers: { [key: string]: [(value: any) => void, (reason?: any) => void, number] } = {};

        const sendMessage = (contentWindow: Window, args: any) => {
            contentWindow.postMessage({ args }, targetOrigin);
        };

        const sendMessageWithReply = <T,>(contentWindow: Window, args: any): Promise<T> => {
            const id = globalId++;
            contentWindow.postMessage({ id, args }, targetOrigin);
            return new Promise((resolve, reject) => {
                const intervalId = window.setTimeout(() => {
                    delete handlers[id];
                }, 30000);
                handlers[id] = [resolve, reject, intervalId];
            });
        };

        const handleMessage = (event: MessageEvent) => {
            const contentWindow = iframeRef.current?.contentWindow;
            const { origin, data, source } = event;
            if (!contentWindow || origin !== targetOrigin || !data || source !== contentWindow) {
                return;
            }

            const departmentName = 'Support';

            if (data.type === 'on') {
                if (data.payload?.event === 'open') {
                    setStyle((oldStyle) => ({ ...oldStyle, ...OPENED_SIZE }));
                }

                if (data.payload?.event === 'close') {
                    setStyle((oldStyle) => ({ ...oldStyle, ...CLOSED_SIZE }));
                }

                if (data.payload?.event === 'chat:connected') {
                    sendMessage(contentWindow, [
                        'webWidget',
                        'updateSettings',
                        {
                            webWidget: {
                                chat: {
                                    departments: {
                                        enabled: [departmentName],
                                        select: departmentName,
                                    },
                                },
                            },
                        },
                    ]);

                    sendMessageWithReply<any>(contentWindow, ['webWidget:get', 'chat:department', departmentName])
                        .then((result) => {
                            const connected = result?.status === 'online';
                            setState({ loaded: true, connected });
                            onLoaded();
                        })
                        .catch(() => {
                            setState({ loaded: true, connected: false });
                            onLoaded();
                        });
                }

                if (data.payload?.event === 'chat:departmentStatus') {
                    const { chatDepartment } = data.payload;
                    if (!chatDepartment) {
                        return;
                    }
                    const connected = chatDepartment?.status === 'online';
                    setState({ loaded: true, connected });
                }
            }

            if (data.type === 'response') {
                if (data.payload.id !== undefined) {
                    const handler = handlers[data.payload.id];
                    if (handler) {
                        delete handlers[data.payload.id];
                        handler[0](data.payload.result);
                    }
                }
            }

            if (data.type === 'loaded') {
                sendMessage(contentWindow, [
                    'webWidget',
                    'updateSettings',
                    { webWidget: { color: { theme: '#02811A' } } },
                ]);
            }
        };

        window.addEventListener('message', handleMessage, false);

        return () => {
            window.removeEventListener('message', handleMessage, false);

            for (const handlerKey of Object.keys(handlers)) {
                const handler = handlers[handlerKey];
                handler[1](new Error('Unmount'));
                window.clearTimeout(handler[2]);
                delete handlers[handlerKey];
            }
        };
    }, []);

    return (
        <iframe
            title="Zendesk"
            src={src}
            style={style}
            ref={iframeRef}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
    );
};
export default LiveChatZendesk;
