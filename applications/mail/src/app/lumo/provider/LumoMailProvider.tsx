import type { MutableRefObject, ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import LumoAgentDrawerContext from '@proton/components/components/drawer/views/lumoAgent/lumoAgentDrawerContext';
import useLumoAgent from '@proton/components/components/lumoAgent/useLumoAgent';
import { defaultESStatus } from '@proton/encrypted-search/constants';
import type { ESStatusBooleans } from '@proton/encrypted-search/models';
import { useFilters } from '@proton/mail/store/filters/hooks';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { useEncryptedSearchContext } from 'proton-mail/containers/EncryptedSearchProvider';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';
import { useInitializeMessage } from 'proton-mail/hooks/message/useInitializeMessage';
import { load as loadConversationAction } from 'proton-mail/store/conversations/conversationsActions';
import { useMailDispatch, useMailStore } from 'proton-mail/store/hooks';

import { buildLumoMailConfig } from '../registry';
import type { MailToolDeps } from '../toolModule';

interface Props {
    children: ReactNode;
}

const EncryptedSearchStatusMirror = ({ into }: { into: MutableRefObject<ESStatusBooleans> }) => {
    const { esStatus } = useEncryptedSearchContext();

    useEffect(() => {
        into.current = esStatus;
    }, [esStatus, into]);

    return null;
};

/**
 * Stands up the Lumo assistant for Mail. It builds the Mail tool pack's config from the store/router
 * hooks and hands it to {@link useLumoAgent}, then exposes the conversation to {@link DrawerLumoView}
 * via context. Mounted above the drawer (see PrivateLayout) so the conversation persists across drawer
 * tab switches and panel open/close, and only when the `LumoInMail` flag is on — flag off, this
 * component is never rendered.
 */
const LumoMailProvider = ({ children }: Props) => {
    const store = useMailStore();
    const dispatch = useMailDispatch();
    const history = useHistory();
    const { applyLocation } = useApplyLocation();
    const initializeMessage = useInitializeMessage();
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();
    const [filters = []] = useFilters();
    const [mailSettings] = useMailSettings();
    const esStatus = useRef<ESStatusBooleans>(defaultESStatus);

    // Latest values, refreshed every render, so the once-built handlers always read the current
    // snapshot (mirrors the POC's ref pattern; keeps the config referentially stable).
    const current = {
        store,
        dispatch,
        history,
        applyLocation,
        initializeMessage,
        folders,
        labels,
        filters,
        mailSettings,
    };
    const latest = useRef(current);
    latest.current = current;

    // Built once: deps read through getters/methods off `latest`, so config identity never changes and
    // useLumoAgent keeps the same executor/session across renders.
    const config = useMemo(() => {
        const deps: MailToolDeps = {
            get store() {
                return latest.current.store;
            },
            get history() {
                return latest.current.history;
            },
            getFolders: () => latest.current.folders,
            getLabels: () => latest.current.labels,
            getFilters: () => latest.current.filters,
            getMailSettings: () => latest.current.mailSettings,
            applyLocation: (params) => latest.current.applyLocation(params),
            getESStatus: () => esStatus.current,
            // Unwrapped so a failed fetch rejects: dispatching a thunk resolves with a rejected action.
            loadConversation: (conversationID) =>
                latest.current.dispatch(loadConversationAction({ conversationID, messageID: undefined })).unwrap(),
            initializeMessage: (messageID, labelID) => latest.current.initializeMessage(messageID, labelID),
        };
        return buildLumoMailConfig(deps);
    }, []);

    const conversation = useLumoAgent(config);

    return (
        <LumoAgentDrawerContext.Provider value={{ ...conversation, cardRenderers: config.cardRenderers }}>
            <EncryptedSearchStatusMirror into={esStatus} />
            {children}
        </LumoAgentDrawerContext.Provider>
    );
};

export default LumoMailProvider;
