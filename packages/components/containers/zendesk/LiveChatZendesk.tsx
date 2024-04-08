import React, { MutableRefObject, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { addHours } from 'date-fns';
import { c } from 'ttag';

import { APPS } from '@proton/shared/lib/constants';
import * as sessionStorageWrapper from '@proton/shared/lib/helpers/sessionStorage';
import * as localStorageWrapper from '@proton/shared/lib/helpers/storage';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';
import { UserModel } from '@proton/shared/lib/interfaces';

import { useConfig, useNotifications } from '../../hooks';

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

const SINGLE_CHAT_KEY = 'zk_state';
const SINGLE_CHAT_TIMEOUT = 10000;

const getIframeUrl = (zendeskKey: string) => {
    const url = getApiSubdomainUrl('/core/v4/resources/zendesk', window.location.origin);
    url.searchParams.set('Key', zendeskKey);
    return url;
};

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

const clearPaidMarkers = () => {
    if (!localStorageWrapper.hasStorage()) {
        return;
    }
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('LiveChat')) {
            if (+(localStorage.getItem(key) || 0) < Date.now()) {
                localStorage.removeItem(key);
            }
        }
    }
};
const setPaidMarker = (userID: string) => {
    return localStorageWrapper.setItem(`LiveChat-${userID}`, addHours(new Date(), 24).getTime().toString());
};
const getPaidMarker = (userID: string) => {
    return +(localStorageWrapper.getItem(`LiveChat-${userID}`) || 0);
};

export const useCanEnableChat = (user: UserModel) => {
    const hasCachedChat = getPaidMarker(user.ID) > Date.now();
    const canEnableChat = user.hasPaidVpn || hasCachedChat;
    const { APP_NAME } = useConfig();

    useEffect(() => {
        if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
            return;
        }
        clearPaidMarkers();
        if (!user.hasPaidVpn) {
            return;
        }
        const setMarker = () => {
            // Clear old items
            clearPaidMarkers();
            // Enable the user to access chat 24 hours after in case she unsubscribes
            setPaidMarker(user.ID);
        };
        setMarker();
        const handle = window.setInterval(setMarker, 60000);
        return () => window.clearInterval(handle);
    }, [user.hasPaidVpn]);

    return APP_NAME === APPS.PROTONVPN_SETTINGS && canEnableChat;
};

export interface ZendeskRef {
    run: (data: object) => void;
    toggle: () => void;
}

interface Props {
    zendeskKey: string;
    zendeskRef?: MutableRefObject<ZendeskRef | undefined>;
    name?: string;
    email?: string;
    onLoaded: () => void;
    onUnavailable: () => void;
    locale: string;
    tags: string[];
}

const LiveChatZendesk = ({ zendeskKey, zendeskRef, name, email, onLoaded, onUnavailable, locale, tags }: Props) => {
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
    const pendingLoadingRef = useRef<{ toggle?: boolean; locale?: string }>({});

    const iframeUrl = getIframeUrl(zendeskKey);

    const src = iframeUrl.toString();
    const targetOrigin = iframeUrl.origin;

    const handleRun = (args: any) => {
        const contentWindow = iframeRef.current?.contentWindow;
        if (!contentWindow || !stateRef.current.loaded) {
            return;
        }
        contentWindow.postMessage({ args }, targetOrigin);
    };

    const handleToggle = () => {
        // Using the ref instead of state to not have to wait for re-render
        if (!stateRef.current.connected) {
            onUnavailable();
            return;
        }
        pendingLoadingRef.current.toggle = true;
        handleRun(['webWidget', 'toggle']);
    };

    useImperativeHandle(zendeskRef, () => ({
        run: handleRun,
        toggle: handleToggle,
    }));

    useEffect(() => {
        if (!state.loaded) {
            return;
        }
        handleRun([
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
        handleRun(['webWidget', 'setLocale', locale]);
    }, [state.loaded, locale]);

    useEffect(() => {
        if (!state.loaded || !tags.length) {
            return;
        }
        handleRun(['webWidget', 'chat:addTags', tags]);
        return () => {
            handleRun(['webWidget', 'chat:removeTags', tags]);
        };
    }, [state.loaded, tags]);

    useEffect(() => {
        if (!state.loaded || !pendingLoadingRef.current) {
            return;
        }
        const oldPending = pendingLoadingRef.current;
        pendingLoadingRef.current = {};
        if (oldPending.toggle) {
            handleToggle();
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
        toggle: (...args) => {
            if (getIsActiveInAnotherWindow()) {
                createNotification({
                    text: c('Info')
                        .t`You can only have one chat instance open at a time. Please close previous conversations before starting a new one.`,
                    type: 'error',
                });
                return;
            }
            actualZendeskRef.current?.toggle(...args);
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
