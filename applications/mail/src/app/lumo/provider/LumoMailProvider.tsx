import type { MutableRefObject, ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { useAddresses } from '@proton/account/addresses/hooks';
import { updateAddressThunk } from '@proton/account/addresses/updateAddress';
import { useUser } from '@proton/account/user/hooks';
import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/app-context/useApi';
import LumoAgentDrawerContext from '@proton/components/components/drawer/views/lumoAgent/lumoAgentDrawerContext';
import useLumoAgent from '@proton/components/components/lumoAgent/useLumoAgent';
import { useSaveVCardContact } from '@proton/components/containers/contacts/hooks/useSaveVCardContact';
import { FILTER_VERSION } from '@proton/components/containers/filters/constants';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useEventManager from '@proton/components/hooks/useEventManager';
import { defaultESStatus } from '@proton/encrypted-search/constants';
import type { ESStatusBooleans } from '@proton/encrypted-search/models';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import { addFilter as addFilterAction, updateFilter as updateFilterAction } from '@proton/mail/store/filters/actions';
import { useFilters } from '@proton/mail/store/filters/hooks';
import { createLabel as createLabelAction, updateLabel as updateLabelAction } from '@proton/mail/store/labels/actions';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { checkSieveFilter } from '@proton/shared/lib/api/filters';
import { updateAutoresponder, updateViewLayout, updateViewMode } from '@proton/shared/lib/api/mailSettings';
import { updateDensity } from '@proton/shared/lib/api/settings';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { useApplyLocation } from '../../hooks/actions/applyLocation/useApplyLocation';
import { useMarkAs } from '../../hooks/actions/markAs/useMarkAs';
import useSnooze from '../../hooks/actions/useSnooze';
import { useInitializeMessage } from '../../hooks/message/useInitializeMessage';
import { load as loadConversationAction } from '../../store/conversations/conversationsActions';
import { backendActionStarted, markAll as markAllAction } from '../../store/elements/elementsActions';
import { useMailDispatch, useMailStore } from '../../store/hooks';
import type { SieveIssue } from '../helpers/sieve';
import { assertSieveValid } from '../helpers/sieve';
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

const discardResult = async (mutation: Promise<unknown>): Promise<void> => {
    await mutation;
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
    const api = useApi();
    const history = useHistory();
    const { applyLocation, applyMultipleLocations } = useApplyLocation();
    const { markAs } = useMarkAs();
    const { snooze } = useSnooze();
    const initializeMessage = useInitializeMessage();
    const saveVCardContact = useSaveVCardContact();
    const { call: refreshEvents } = useEventManager();
    const { information: themeInformation, setTheme } = useTheme();
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();
    const [filters = []] = useFilters();
    // Not `useCategoriesView`, whose `shouldShowTabs` also requires the user to be sitting in the Inbox:
    // a mark-all scoped to a category is valid from wherever they are.
    const { activeCategoriesTabs } = useCategoriesData();
    const [mailSettings] = useMailSettings();
    const [contactEmails = []] = useContactEmails();
    const [userSettings] = useUserSettings();
    const [user] = useUser();
    const [addresses = []] = useAddresses();
    const esStatus = useRef<ESStatusBooleans>(defaultESStatus);

    // Latest values, refreshed every render, so the once-built handlers always read the current
    // snapshot (mirrors the POC's ref pattern; keeps the config referentially stable).
    const current = {
        store,
        dispatch,
        api,
        history,
        applyLocation,
        applyMultipleLocations,
        markAs,
        snooze,
        initializeMessage,
        saveVCardContact,
        refreshEvents,
        themeInformation,
        setTheme,
        folders,
        labels,
        filters,
        activeCategoriesTabs,
        mailSettings,
        contactEmails,
        userSettings,
        user,
        addresses,
    };
    const latest = useRef(current);
    latest.current = current;

    // Built once: deps read through getters/methods off `latest`, so config identity never changes and
    // useLumoAgent keeps the same executor/session across renders.
    const config = useMemo(() => {
        const writeMailSettings = async (request: object) => {
            const { MailSettings } = await latest.current.api<{ MailSettings: MailSettings }>(request);
            latest.current.dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        };

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
            getActiveCategoryTabs: () => latest.current.activeCategoriesTabs,
            getMailSettings: () => latest.current.mailSettings,
            getContactEmails: () => latest.current.contactEmails,
            // The save writes straight to the API, so the store only reflects it after an event refresh.
            saveVCardContact: async (contactID, vCardContact) => {
                await latest.current.saveVCardContact(contactID, vCardContact);
                await latest.current.refreshEvents();
            },
            getUserSettings: () => latest.current.userSettings,
            getUser: () => latest.current.user,
            getAddresses: () => latest.current.addresses,
            getThemeInformation: () => latest.current.themeInformation,
            setTheme: (theme, mode) => latest.current.setTheme(theme, mode),
            setViewLayout: (viewLayout) => writeMailSettings(updateViewLayout(viewLayout)),
            setViewMode: (viewMode) => writeMailSettings(updateViewMode(viewMode)),
            setDensity: async (density) => {
                const { UserSettings } = await latest.current.api<{ UserSettings: UserSettings }>(
                    updateDensity(density)
                );
                latest.current.dispatch(userSettingsActions.set({ UserSettings }));
            },
            setAutoResponder: (autoResponder) => writeMailSettings(updateAutoresponder(autoResponder)),
            updateAddress: (params) => latest.current.dispatch(updateAddressThunk(params)),
            applyLocation: (params) => latest.current.applyLocation(params),
            // async so applyMultipleLocations' synchronous validation throws surface as a rejection.
            applyMultipleLocations: async (params) => discardResult(latest.current.applyMultipleLocations(params)),
            markAs: (params) => discardResult(latest.current.markAs(params)),
            // Mirrors useMarkAllAs: the thunk always finishes the pending action, so the paired start has
            // to come from here. Unwrapped so a failed request rejects.
            markAll: async (params) => {
                const { dispatch: dispatchMarkAll } = latest.current;
                dispatchMarkAll(backendActionStarted());
                await dispatchMarkAll(markAllAction(params)).unwrap();
            },
            snooze: (params, sourceAction) => latest.current.snooze(params, sourceAction),
            createLabel: (params) => latest.current.dispatch(createLabelAction(params)),
            updateLabel: (params) => discardResult(latest.current.dispatch(updateLabelAction(params))),
            addFilter: (filter) => latest.current.dispatch(addFilterAction({ filter })),
            updateFilter: (id, filter) => discardResult(latest.current.dispatch(updateFilterAction({ id, filter }))),
            validateSieve: async (sieve) => {
                const { Issues = [] } = await latest.current.api<{ Issues?: SieveIssue[] }>(
                    checkSieveFilter({ Version: FILTER_VERSION, Sieve: sieve })
                );
                assertSieveValid(Issues);
            },
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
        <LumoAgentDrawerContext.Provider
            value={{ ...conversation, cardRenderers: config.cardRenderers, serverToolMeta: config.serverToolMeta }}
        >
            <EncryptedSearchStatusMirror into={esStatus} />
            {children}
        </LumoAgentDrawerContext.Provider>
    );
};

export default LumoMailProvider;
