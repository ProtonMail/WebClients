import { type FC, createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
    ExtensionConnect,
    type ExtensionConnectContextValue,
    INITIAL_WORKER_STATE,
} from 'proton-pass-extension/lib/components/Extension/ExtensionConnect';
import { useExpanded } from 'proton-pass-extension/lib/hooks/useExpanded';
import { useExtensionConnectContext } from 'proton-pass-extension/lib/hooks/useExtensionConnectContext';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { NotificationsContext } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { useActionRequestEffect } from '@proton/pass/hooks/useActionRequestEffect';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { clientReady } from '@proton/pass/lib/client';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import { syncRequest } from '@proton/pass/store/actions/requests';
import type { AppState, MaybeNull, PopupInitialState } from '@proton/pass/types';
import { AppStatus, WorkerMessageType, type WorkerMessageWithSender } from '@proton/pass/types';
import type { ParsedUrl } from '@proton/pass/utils/url/parser';
import { parseUrl } from '@proton/pass/utils/url/parser';
import noop from '@proton/utils/noop';

export interface PopupContextValue extends ExtensionConnectContextValue {
    initialized: boolean /* retrieved popup initial state */;
    expanded: boolean /* is popup expanded into a separate window */;
    ready: boolean /* enable UI user actions */;
    state: AppState & { initial: PopupInitialState };
    url: ParsedUrl /* current tab parsed URL */;
    sync: () => void;
}

export const INITIAL_POPUP_STATE: PopupInitialState = {
    search: '',
    draft: null,
    filters: null,
    selectedItem: null,
    passwordOptions: null,
};

export const PopupContext = createContext<PopupContextValue>({
    context: null,
    initialized: false,
    expanded: false,
    ready: false,
    state: { ...INITIAL_WORKER_STATE, initial: INITIAL_POPUP_STATE },
    url: parseUrl(),
    lock: noop,
    logout: noop,
    sync: noop,
});

/* this cannot be included directly in `PopupContextProvider` because
 * of the `useExtensionContext` call which requires this component to
 * be a descendant of `ExtensionConnect` */
const PopupContextContainer: FC = ({ children }) => {
    const extensionContext = useExtensionConnectContext();
    const { status } = extensionContext.state;
    const { url, tabId } = extensionContext.context!;

    const { createNotification } = useNotifications();
    const notificationsManager = useContext(NotificationsContext);
    useEffect(() => notificationsManager.setOffset({ y: 10 }), []);

    const [initial, setInitial] = useState<MaybeNull<PopupInitialState>>(null);
    const expanded = useExpanded();

    const sync = useActionRequestEffect(syncRequest(), {
        onStart: () =>
            createNotification({
                key: syncRequest(),
                showCloseButton: false,
                text: (
                    <>
                        {c('Info').t`Syncing your vaults…`} <CircleLoader />
                    </>
                ),
            }),
    });

    const syncing = sync.loading || extensionContext.state.status === AppStatus.BOOTING;

    useEffect(() => {
        if (clientReady(status)) {
            void sendMessage.onSuccess(
                popupMessage({ type: WorkerMessageType.POPUP_INIT, payload: { tabId } }),
                setInitial
            );
        }
    }, [status]);

    const popupContext = useMemo<PopupContextValue>(() => {
        const { state, ready } = extensionContext;

        return {
            ...extensionContext,
            initialized: initial !== null /* `POPUP_INIT` response resolved */,
            expanded,
            ready: ready && !syncing /* worker ready and no ongoing syncs */,
            state: { ...state, initial: initial ?? INITIAL_POPUP_STATE },
            url,
        };
    }, [extensionContext, syncing, initial]);

    return <PopupContext.Provider value={popupContext}>{children}</PopupContext.Provider>;
};

export const PopupContextProvider: FC = ({ children }) => {
    const { createNotification } = useNotifications();
    const notificationEnhancer = useNotificationEnhancer({ onLink: (url) => browser.tabs.create({ url }) });

    const onWorkerMessage = (message: WorkerMessageWithSender) => {
        if (message.type === WorkerMessageType.NOTIFICATION) {
            createNotification(notificationEnhancer(message.payload.notification));
        }
    };

    return (
        <ExtensionConnect endpoint="popup" messageFactory={popupMessage} onWorkerMessage={onWorkerMessage}>
            <PopupContextContainer>{children}</PopupContextContainer>
        </ExtensionConnect>
    );
};
