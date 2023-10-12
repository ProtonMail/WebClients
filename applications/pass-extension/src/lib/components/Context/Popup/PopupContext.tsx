import { type FC, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type ExtensionAppContextValue,
    ExtensionContextProvider,
    INITIAL_WORKER_STATE,
} from 'proton-pass-extension/lib/components/Extension/ExtensionContext';
import { useExpanded } from 'proton-pass-extension/lib/hooks/useExpanded';
import { useExtensionContext } from 'proton-pass-extension/lib/hooks/useExtensionContext';
import { enhanceNotification } from 'proton-pass-extension/lib/utils/enhance-notification';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { NotificationsContext } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { useRequestStatusEffect } from '@proton/pass/hooks/useRequestStatusEffect';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { workerReady } from '@proton/pass/lib/worker';
import * as requests from '@proton/pass/store/actions/requests';
import { selectWorkerSyncing } from '@proton/pass/store/selectors';
import type { MaybeNull, PopupInitialState, WorkerState } from '@proton/pass/types';
import { WorkerMessageType, type WorkerMessageWithSender, WorkerStatus } from '@proton/pass/types';
import type { ParsedUrl } from '@proton/pass/utils/url';
import { parseUrl } from '@proton/pass/utils/url';
import noop from '@proton/utils/noop';

export interface PopupContextValue extends ExtensionAppContextValue {
    initialized: boolean /* retrieved popup initial state */;
    expanded: boolean /* is popup expanded into a separate window */;
    ready: boolean /* enable UI user actions */;
    state: WorkerState & { initial: PopupInitialState };
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
 * be a descendant of `ExtensionContextProvider`  */
const PopupContextContainer: FC = ({ children }) => {
    const extensionContext = useExtensionContext();
    const { status } = extensionContext.state;
    const { url, tabId } = extensionContext.context!;

    const { createNotification } = useNotifications();
    const notificationsManager = useContext(NotificationsContext);
    useEffect(() => notificationsManager.setOffset({ y: 10 }), []);

    const [initial, setInitial] = useState<MaybeNull<PopupInitialState>>(null);
    const syncing = useSelector(selectWorkerSyncing) || extensionContext.state.status === WorkerStatus.BOOTING;

    const expanded = useExpanded();

    useRequestStatusEffect(requests.syncRequest(), {
        onStart: () =>
            createNotification({
                key: requests.syncRequest(),
                showCloseButton: false,
                text: (
                    <>
                        {c('Info').t`Syncing your vaults…`} <CircleLoader />
                    </>
                ),
            }),
    });

    useEffect(() => {
        if (workerReady(status)) {
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

    const onWorkerMessage = (message: WorkerMessageWithSender) => {
        if (message.type === WorkerMessageType.NOTIFICATION) {
            createNotification(enhanceNotification(message.payload.notification));
        }
    };

    return (
        <ExtensionContextProvider endpoint="popup" messageFactory={popupMessage} onWorkerMessage={onWorkerMessage}>
            <PopupContextContainer>{children}</PopupContextContainer>
        </ExtensionContextProvider>
    );
};
