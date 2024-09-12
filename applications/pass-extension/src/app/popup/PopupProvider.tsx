import type { PropsWithChildren } from 'react';
import { type FC, createContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';
import { useExpanded } from 'proton-pass-extension/lib/hooks/useExpanded';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { clientReady } from '@proton/pass/lib/client';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { syncRequest } from '@proton/pass/store/actions/requests';
import { selectRequestInFlight } from '@proton/pass/store/selectors';
import type { MaybeNull, PopupInitialState } from '@proton/pass/types';
import { AppStatus, WorkerMessageType } from '@proton/pass/types';

export interface PopupContextValue {
    expanded: boolean /* is popup expanded into a separate window */;
    initial: PopupInitialState;
    initialized: boolean /* retrieved popup initial state */;
    ready: boolean /* enable UI user actions */;
}

export const INITIAL_POPUP_STATE: PopupInitialState = {
    search: '',
    filters: null,
    selectedItem: null,
};

export const PopupContext = createContext<MaybeNull<PopupContextValue>>(null);
export const usePopupContext = createUseContext(PopupContext);

/* this cannot be included directly in `PopupContextProvider` because
 * of the `useExtensionContext` call which requires this component to
 * be a descendant of `ExtensionConnect` */
export const PopupProvider: FC<PropsWithChildren> = ({ children }) => {
    const app = useAppState();
    const { ready } = useExtensionClient();
    const { tabId } = useExtensionContext();
    const { status } = app.state;

    const [initial, setInitial] = useState<MaybeNull<PopupInitialState>>(null);
    const expanded = useExpanded();

    const sync = useSelector(selectRequestInFlight(syncRequest()));
    const syncing = sync || status === AppStatus.BOOTING;

    useEffect(() => {
        if (clientReady(status)) {
            void sendMessage.onSuccess(
                popupMessage({ type: WorkerMessageType.POPUP_INIT, payload: { tabId } }),
                setInitial
            );
        }
    }, [status]);

    const ctx = useMemo<PopupContextValue>(
        () => ({
            expanded,
            initial: initial ?? INITIAL_POPUP_STATE,
            initialized: initial !== null /* `POPUP_INIT` response resolved */,
            ready: ready && !syncing /* worker ready and no ongoing syncs */,
        }),
        [ready, syncing, initial]
    );

    return <PopupContext.Provider value={ctx}>{children}</PopupContext.Provider>;
};
