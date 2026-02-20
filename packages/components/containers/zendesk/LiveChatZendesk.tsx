import type { MutableRefObject } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { c } from 'ttag';

import type { ZendeskRef } from '@proton/components/containers/zendesk/helper';
import { getZendeskIframeUrl } from '@proton/components/containers/zendesk/helper';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import * as sessionStorageWrapper from '@proton/shared/lib/helpers/sessionStorage';
import * as localStorageWrapper from '@proton/shared/lib/helpers/storage';
import type { Api } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

type MessageDestination = 'proton' | 'zendesk';
const fetchJWT = async (api: Api) => {
    try {
        const { JWT } = await api<{ JWT: string }>({
            url: `auth/v4/zendesk/jwt`,
            method: 'post',
        });
        return JWT;
    } catch (e) {
        return;
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

export const getIsSelfChat = () => {
    return sessionStorageWrapper.getItem(SINGLE_CHAT_KEY);
};
const removeSelfActiveMarker = () => {
    return sessionStorageWrapper.removeItem(SINGLE_CHAT_KEY);
};
const getIsActiveInAnotherWindow = () => {
    return !getIsSelfChat() && +(localStorageWrapper.getItem(SINGLE_CHAT_KEY) || 0) > Date.now();
};
const setActiveMarker = () => {
    localStorageWrapper.setItem(SINGLE_CHAT_KEY, `${+Date.now() + SINGLE_CHAT_TIMEOUT}`);
    sessionStorageWrapper.setItem(SINGLE_CHAT_KEY, '1');
};

interface Props {
    zendeskRef?: MutableRefObject<ZendeskRef | undefined>;
    name?: string;
    email?: string;
    onLoaded: () => void;
    onUnavailable: () => void;
    locale: string;
    tags: string[];
}

const LiveChatZendesk = ({ zendeskRef, name, email, onLoaded, onUnavailable, locale, tags }: Props) => {
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
    const [state, setState] = useState({ loaded: false, connected: false });
    const stateRef = useRef({ loaded: false, connected: false });
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const pendingLoadingRef = useRef<{ open?: boolean; locale?: string }>({});
    const [isZendeskV2Enabled] = useState(useFlag('UseZendeskV2'));

    const iframeUrl = getZendeskIframeUrl(isZendeskV2Enabled);

    const src = iframeUrl.toString();
    const targetOrigin = iframeUrl.origin;

    const sendMessage = (args: any, destination: MessageDestination = 'zendesk') => {
        const contentWindow = iframeRef.current?.contentWindow;
        if (!contentWindow || !stateRef.current.loaded) {
            return;
        }
        contentWindow.postMessage({ args, destination }, targetOrigin);
    };

    const handleOpen = () => {
        // Using the ref instead of state to not have to wait for re-render
        if (!stateRef.current.connected) {
            onUnavailable();
            return;
        }
        pendingLoadingRef.current.open = true;
        if (isZendeskV2Enabled) {
            sendMessage(['messenger', 'open']);
        } else {
            sendMessage(['webWidget', 'toggle']);
        }
    };

    useImperativeHandle(zendeskRef, () => ({
        run: sendMessage,
        open: handleOpen,
    }));

    useEffect(() => {
        if (!state.loaded || isZendeskV2Enabled) {
            return;
        }

        sendMessage([
            'webWidget',
            'prefill',
            {
                name: { value: name, readOnly: false },
                email: { value: email, readOnly: Boolean(email) },
            },
        ]);
    }, [state.loaded, name, email]);

    useEffect(() => {
        if (!state.loaded) {
            return;
        }
        if (isZendeskV2Enabled) {
            sendMessage(['messenger:set', 'locale', locale]);
        } else {
            sendMessage(['webWidget', 'setLocale', locale]);
        }
    }, [state.loaded, locale]);

    useEffect(() => {
        if (!state.loaded || !tags.length) {
            return;
        }
        if (isZendeskV2Enabled) {
            sendMessage(['messenger:set', 'conversationTags', tags]);
        } else {
            sendMessage(['webWidget', 'chat:addTags', tags]);
        }
    }, [state.loaded, tags]);

    useEffect(() => {
        if (!state.loaded || !pendingLoadingRef.current) {
            return;
        }
        const oldPending = pendingLoadingRef.current;
        pendingLoadingRef.current = {};
        if (oldPending.open) {
            handleOpen();
        }

        (async () => {
            const jwt = await fetchJWT(api);
            if (jwt) {
                sendMessage(['login', jwt], 'proton');
            }
        })().catch(noop);
    }, [state.loaded]);

    useEffect(() => {
        let globalId = 1;
        const handlers: { [key: string]: [(value: any) => void, (reason?: any) => void, number] } = {};

        const sendMessageWithReply = <T,>(
            contentWindow: Window,
            args: any,
            destination: MessageDestination = 'zendesk'
        ): Promise<T> => {
            const id = globalId++;
            contentWindow.postMessage({ id, args, destination }, targetOrigin);
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

            const departmentName = isZendeskV2Enabled ? 'VPN Chat' : 'Support';

            if (data.type === 'on') {
                if (data.payload?.event === 'open') {
                    setStyle((oldStyle) => ({ ...oldStyle, ...OPENED_SIZE }));
                }

                if (data.payload?.event === 'close') {
                    setStyle((oldStyle) => ({ ...oldStyle, ...CLOSED_SIZE }));
                }

                if (data.payload?.event === 'chat:connected') {
                    sendMessage([
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
                            stateRef.current = { loaded: true, connected };
                            setState({ loaded: true, connected });
                            onLoaded();
                        })
                        .catch(() => {
                            stateRef.current = { loaded: true, connected: false };
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
                    stateRef.current = { loaded: true, connected };
                    setState({ loaded: true, connected });
                }
            } else if (data.type === 'response') {
                if (data.payload.id !== undefined) {
                    const handler = handlers[data.payload.id];
                    if (handler) {
                        delete handlers[data.payload.id];
                        handler[0](data.payload.result);
                    }
                }
            } else if (data.type === 'loaded') {
                if (isZendeskV2Enabled) {
                    const updatedState = { loaded: true, connected: true };
                    stateRef.current = updatedState;
                    setState(updatedState);
                    sendMessage([
                        'messenger:set',
                        'customization',
                        {
                            theme: {
                                primary: '#6d4aff',
                            },
                        },
                    ]);
                } else {
                    sendMessage([
                        'webWidget',
                        'updateSettings',
                        {
                            webWidget: {
                                color: {
                                    launcher: '#6d4aff',
                                    button: '#6d4aff',
                                    header: '#261b57',
                                },
                            },
                        },
                    ]);
                }
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
        <div className={!state.connected ? 'hidden' : ''}>
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

    useEffect(() => {
        if (!isActive) {
            rest.onLoaded();
        }
    }, []);

    if (!isActive) {
        return null;
    }

    return <LiveChatZendesk zendeskRef={actualZendeskRef} {...rest} />;
};

export default LiveChatZendeskSingleton;
