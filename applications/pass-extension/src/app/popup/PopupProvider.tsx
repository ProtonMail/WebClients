import type { PropsWithChildren } from 'react';
import { type FC, createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector, useStore } from 'react-redux';

import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { MODEL_VERSION } from '@proton/pass/constants';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { clientReady } from '@proton/pass/lib/client';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { isEditItemDraft, isNewItemDraft } from '@proton/pass/lib/items/item.predicates';
import { syncRequest } from '@proton/pass/store/actions/requests';
import { selectLatestDraft, selectRequestInFlight } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { MaybeNull, PopupInitialState } from '@proton/pass/types';
import { AppStatus, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

type Props = { ready: boolean };
export interface PopupContextValue {
    initialized: boolean /* retrieved popup initial state */;
    interactive: boolean /* enable UI user actions */;
}

export const PopupContext = createContext<MaybeNull<PopupContextValue>>(null);
export const usePopupContext = createUseContext(PopupContext);

/* this cannot be included directly in `PopupContextProvider` because
 * of the `useExtensionContext` call which requires this component to
 * be a descendant of `ExtensionConnect` */
export const PopupProvider: FC<PropsWithChildren<Props>> = ({ children, ready }) => {
    const { onTelemetry } = usePassCore();
    const store = useStore<State>();
    const { status } = useAppState();
    const { tabId } = useExtensionContext();
    const { navigate, selectItem } = useNavigationActions();
    const { setFilters } = useNavigationFilters();

    const [initialized, setInitialized] = useState<boolean>(false);
    const sync = useSelector(selectRequestInFlight(syncRequest()));
    const syncing = sync || status === AppStatus.BOOTING;
    const interactive = clientReady(status) && ready && !syncing;

    const handleInit = useCallback((data: PopupInitialState) => {
        setInitialized(true);

        const { selectedItem } = data;
        const filters = { ...data.filters, search: data.search ?? '' };
        const draft = selectLatestDraft(store.getState());

        if (isNewItemDraft(draft)) {
            /** When supporting drafts v2: remove these as we will be able to leverage
             * the full draft state and give the user more control over the drafts */
            return navigate(getLocalPath(`item/new/${draft.type}`), { hash: 'draft', mode: 'replace', filters });
        }

        if (isEditItemDraft(draft)) {
            return selectItem(draft.shareId, draft.itemId, { hash: 'draft', mode: 'replace', view: 'edit', filters });
        }

        if (selectedItem) selectItem(selectedItem.shareId, selectedItem.itemId, { filters });
        else setFilters(filters);

        onTelemetry(TelemetryEventName.ExtensionUsed, {}, { modelVersion: MODEL_VERSION });
    }, []);

    useEffect(() => {
        if (clientReady(status)) {
            void sendMessage.onSuccess(
                popupMessage({ type: WorkerMessageType.POPUP_INIT, payload: { tabId } }),
                handleInit
            );
        }
    }, [status]);

    const ctx = useMemo<PopupContextValue>(
        () => ({
            initialized /* `POPUP_INIT` response resolved */,
            interactive /* worker ready and no ongoing syncs */,
        }),
        [interactive, initialized]
    );

    return <PopupContext.Provider value={ctx}>{children}</PopupContext.Provider>;
};
