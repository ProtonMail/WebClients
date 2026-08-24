import type { MutableRefObject } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { c } from 'ttag';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import * as sessionStorageWrapper from '@proton/shared/lib/helpers/sessionStorage';
import * as localStorageWrapper from '@proton/shared/lib/helpers/storage';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import useConfig from '../../hooks/useConfig';
import useNotifications from '../../hooks/useNotifications';
import { useSilentApi } from '../../hooks/useSilentApi';
import type { ZendeskRef } from './helper';
import { getZendeskIframeUrl } from './helper';

type MessageDestination = 'proton' | 'zendesk';

const fetchJWT = async (api: Api) => {
    try {
        const { JWT } = await api<{ JWT: string }>({
            url: `auth/v4/zendesk/jwt`,
            method: 'post',
        });
        return JWT;
    } catch (e) {
        captureMessage('Zendesk: Failed to fetch JWT', {
            level: 'error',
            extra: { error: e },
        });
    }
};

// The sizes for these are hardcoded since the widget calculates it based on the viewport, and since it's in
// an iframe it needs to have something reasonable.
// The main chat widget.
const OPENED_SIZE = {
    height: `${572 / 16}rem`,
    width: `${374 / 16}rem`,
};
// The small button to toggle the chat.
const CLOSED_SIZE = {
    height: `${90 / 16}rem`,
    width: `${140 / 16}rem`,
};

const SINGLE_CHAT_KEY = 'zk_state';
const SINGLE_CHAT_TIMEOUT = 10000;

export const hasActiveZendeskChat = () => {
    return sessionStorageWrapper.getItem(SINGLE_CHAT_KEY);
};
const removeSelfActiveMarker = () => {
    return sessionStorageWrapper.removeItem(SINGLE_CHAT_KEY);
};
const getIsActiveInAnotherWindow = () => {
    return !hasActiveZendeskChat() && +(localStorageWrapper.getItem(SINGLE_CHAT_KEY) || 0) > Date.now();
};
const setActiveMarker = () => {
    localStorageWrapper.setItem(SINGLE_CHAT_KEY, `${+Date.now() + SINGLE_CHAT_TIMEOUT}`);
    sessionStorageWrapper.setItem(SINGLE_CHAT_KEY, '1');
};

interface Props {
    zendeskRef?: MutableRefObject<ZendeskRef | undefined>;
    autoLaunch: boolean;
    locale: string;
    tags: string[];
}

const LiveChatZendesk = ({ zendeskRef, autoLaunch, locale, tags }: Props) => {
    const api = useSilentApi();
    const [style, setStyle] = useState({
        position: 'absolute',
        bottom: 0,
        right: 0,
        maxHeight: '100%',
        maxWidth: '100%',
        zIndex: '999999',
        ...CLOSED_SIZE,
    });
    const [loaded, setLoaded] = useState(false);
    const loadedRef = useRef(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const pendingLoadingRef = useRef<{ open?: boolean; locale?: string }>({});
    const { APP_NAME } = useConfig();
    const iframeUrl = getZendeskIframeUrl(APP_NAME);

    const src = iframeUrl.toString();
    const targetOrigin = iframeUrl.origin;

    const sendMessage = (args: any, destination: MessageDestination = 'zendesk') => {
        const contentWindow = iframeRef.current?.contentWindow;
        if (!contentWindow || !loadedRef.current) {
            captureMessage('Zendesk: Sending message to invalid iframe', {
                level: 'error',
                extra: { hasContentWindow: !!contentWindow, isLoaded: loadedRef.current, args: args[0] },
            });
            return;
        }
        try {
            contentWindow.postMessage({ args, destination }, targetOrigin);
        } catch (e) {
            captureMessage('Zendesk: postMessage failed', {
                level: 'error',
                extra: { error: e, args: args[0], destination },
            });
        }
    };

    const handleOpen = () => {
        // Using the ref instead of state to not have to wait for re-render
        pendingLoadingRef.current.open = true;
        sendMessage(['messenger', 'open']);
    };

    useImperativeHandle(zendeskRef, () => ({
        run: sendMessage,
        open: handleOpen,
    }));

    useEffect(() => {
        if (loaded) {
            (async () => {
                const jwt = await fetchJWT(api);
                if (jwt) {
                    sendMessage(['login', jwt], 'proton');
                }
            })().catch(noop);
        }
    }, [loaded]);

    useEffect(() => {
        if (!loaded) {
            return;
        }

        sendMessage(['messenger:set', 'locale', locale]);
    }, [loaded, locale]);

    useEffect(() => {
        if (!loaded || !tags.length) {
            return;
        }
        sendMessage(['messenger:set', 'conversationTags', tags]);
        // `id` is from Zendesk. Talk to support team for any questions
        sendMessage(['messenger:set', 'conversationFields', [{ id: '34274976897554', value: tags[0] }]]);
    }, [loaded, tags]);

    useEffect(() => {
        if (!loaded || !pendingLoadingRef.current) {
            return;
        }
        const oldPending = pendingLoadingRef.current;
        pendingLoadingRef.current = {};
        if (oldPending.open) {
            handleOpen();
        }
    }, [loaded]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const contentWindow = iframeRef.current?.contentWindow;
            const { origin, data, source } = event;
            if (!contentWindow || origin !== targetOrigin || !data || source !== contentWindow) {
                return;
            }

            if (data.type === 'on') {
                if (data.payload?.event === 'open') {
                    setStyle((oldStyle) => ({ ...oldStyle, ...OPENED_SIZE }));
                }

                if (data.payload?.event === 'close') {
                    setStyle((oldStyle) => ({ ...oldStyle, ...CLOSED_SIZE }));
                }
            } else if (data.type === 'loaded') {
                loadedRef.current = true;
                setLoaded(true);
                sendMessage([
                    'messenger:set',
                    'customization',
                    {
                        theme: {
                            primary: '#6d4aff',
                        },
                    },
                ]);
                if (autoLaunch) {
                    handleOpen();
                }
            } else if (data.type === 'login-response') {
                // payload will be `null` on successful authentication and will contain error details for failed attempts
                if (data.payload?.message) {
                    const { type, reason, message } = data.payload;
                    const safeReason = typeof reason === 'string' ? reason : '';
                    const [status] = safeReason.split(':');
                    captureMessage('Zendesk: Authentication failed', {
                        level: 'error',
                        extra: {
                            type,
                            reason: btoa(safeReason),
                            message,
                            status,
                        },
                    });
                }
            }
        };

        window.addEventListener('message', handleMessage, false);

        return () => {
            window.removeEventListener('message', handleMessage, false);
        };
    }, []);

    return (
        <div className={!loaded ? 'hidden' : ''}>
            <iframe
                title="Zendesk"
                src={src}
                style={style}
                ref={iframeRef}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
        </div>
    );
};

const LiveChatZendeskSingleton = ({ zendeskRef, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const [isActive, setIsActive] = useState(() => !getIsActiveInAnotherWindow());
    const actualZendeskRef = useRef<ZendeskRef>();

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (getIsActiveInAnotherWindow()) {
                return;
            }
            setIsActive(true);
            setActiveMarker();
        }, SINGLE_CHAT_TIMEOUT / 2);

        return () => {
            clearInterval(interval);
            removeSelfActiveMarker();
        };
    }, []);

    useImperativeHandle(zendeskRef, () => ({
        run: (...args) => actualZendeskRef.current?.run(...args),
        open: (...args) => {
            if (getIsActiveInAnotherWindow()) {
                createNotification({
                    text: c('Info')
                        .t`You can only have one chat instance open at a time. Please close previous conversations before starting a new one.`,
                    type: 'error',
                });
                return;
            }
            actualZendeskRef.current?.open(...args);
        },
    }));

    if (!isActive) {
        return null;
    }

    return <LiveChatZendesk zendeskRef={actualZendeskRef} {...rest} />;
};

export default LiveChatZendeskSingleton;
