import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    ExtensionConnect,
    type ExtensionConnectContextValue,
    INITIAL_WORKER_STATE,
    useExtensionConnect,
} from 'proton-pass-extension/lib/components/Extension/ExtensionConnect';
import { useExpanded } from 'proton-pass-extension/lib/hooks/useExpanded';

import { NotificationsContext } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { clientReady } from '@proton/pass/lib/client';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { syncRequest } from '@proton/pass/store/actions/requests';
import { selectRequestInFlight } from '@proton/pass/store/selectors';
import type { AppState, MaybeNull, PopupInitialState } from '@proton/pass/types';
import { AppStatus, WorkerMessageType, type WorkerMessageWithSender } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export interface PopupContextValue extends ExtensionConnectContextValue {
    initialized: boolean /* retrieved popup initial state */;
    expanded: boolean /* is popup expanded into a separate window */;
    ready: boolean /* enable UI user actions */;
    state: AppState & { initial: PopupInitialState };
    sync: () => void;
}

export const INITIAL_POPUP_STATE: PopupInitialState = {
    search: '',
    filters: null,
    selectedItem: null,
};

export const PopupContext = createContext<PopupContextValue>({
    context: null,
    initialized: false,
    expanded: false,
    ready: false,
    state: { ...INITIAL_WORKER_STATE, initial: INITIAL_POPUP_STATE },
    lock: noop,
    logout: noop,
    sync: noop,
});

/* this cannot be included directly in `PopupContextProvider` because
 * of the `useExtensionContext` call which requires this component to
 * be a descendant of `ExtensionConnect` */
const PopupContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const extensionContext = useExtensionConnect();
    const { status } = extensionContext.state;
    const { tabId } = extensionContext.context!;

    const notificationsManager = useContext(NotificationsContext);
    useEffect(() => notificationsManager.setOffset({ y: 10 }), []);

    const [initial, setInitial] = useState<MaybeNull<PopupInitialState>>(null);
    const expanded = useExpanded();

    const sync = useSelector(selectRequestInFlight(syncRequest()));
    const syncing = sync || extensionContext.state.status === AppStatus.BOOTING;

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
        };
    }, [extensionContext, syncing, initial]);

    return <PopupContext.Provider value={popupContext}>{children}</PopupContext.Provider>;
};

export const PopupProvider: FC<PropsWithChildren> = ({ children }) => {
    const { createNotification } = useNotifications();
    const enhance = useNotificationEnhancer();

    const onWorkerMessage = (message: WorkerMessageWithSender) => {
        if (message.type === WorkerMessageType.NOTIFICATION) {
            createNotification(enhance(message.payload.notification));
        }
    };

    return (
        <ExtensionConnect endpoint="popup" messageFactory={popupMessage} onWorkerMessage={onWorkerMessage}>
            <PopupContextProvider>{children}</PopupContextProvider>
        </ExtensionConnect>
    );
};

export const usePopupContext = () => useContext(PopupContext);
