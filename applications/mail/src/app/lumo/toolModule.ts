import type { History } from 'history';

import type { updateAddressThunk } from '@proton/account/addresses/updateAddress';
import type { ThemeContextInterface } from '@proton/components/containers/themes/ThemeProvider';
import type { ESStatusBooleans } from '@proton/encrypted-search/models';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import type { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import type {
    createLabel as createLabelAction,
    updateLabel as updateLabelAction,
} from '@proton/mail/store/labels/actions';
import type { PartialMessageState } from '@proton/mail/store/messages/messagesTypes';
import type { updateAutoresponder } from '@proton/shared/lib/api/mailSettings';
import type { DENSITY } from '@proton/shared/lib/constants';
import type {
    Address,
    Folder,
    Label,
    MailSettings,
    Recipient,
    UserModel,
    UserSettings,
} from '@proton/shared/lib/interfaces';
import type { ContactEmail, ContactMetadata } from '@proton/shared/lib/interfaces/contacts/Contact';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import type { VIEW_LAYOUT, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import type { ThemeInformation } from '@proton/shared/lib/themes/themes';
import type { CreateFilter, Filter } from '@proton/sieve/filterModel';

import type { SOURCE_ACTION } from '../components/list/list-telemetry/useListTelemetry';
import type {
    ApplyLocationLabelProps,
    ApplyLocationMoveProps,
    ApplyLocationStarProps,
    ApplyMultipleLocationsParams,
} from '../hooks/actions/applyLocation/interface';
import type { MarkAsParams } from '../hooks/actions/markAs/useMarkAs';
import type { SnoozeProps } from '../hooks/actions/useSnooze';
import type { RecipientType } from '../models/address';
import type { markAll as markAllAction } from '../store/elements/elementsActions';
import type { MailStore } from '../store/store';

/** The single-location apply mutation, as exposed by `useApplyLocation`. */
type ApplyLocation = (
    params: ApplyLocationMoveProps | ApplyLocationLabelProps | ApplyLocationStarProps
) => Promise<PromiseSettledResult<string | undefined>[]>;

/**
 * Read-only store access — the only two members a tool ever needs. Tools never dispatch: every mutation
 * is a named method on {@link MailToolDeps}, running the same optimistic/undo path as the UI, so
 * narrowing here turns an accidental `mail.store.dispatch(...)` into a compile error.
 */
export type ToolStore = Pick<MailStore, 'getState' | 'subscribe'>;

/**
 * The Mail store/router access a tool handler needs at call time. Handlers are built once (so the
 * agent config stays referentially stable — see {@link buildLumoMailConfig}), so every field that can
 * change between renders is read through a getter/method rather than captured: the provider refreshes
 * the backing values each render and the handler always sees the current snapshot. `store` and
 * `history` are stable instances, so they are plain properties.
 */
export interface MailToolDeps {
    store: ToolStore;
    history: History;
    getFolders: () => Folder[];
    getLabels: () => Label[];
    getFilters: () => Filter[];
    getActiveCategoryTabs: () => CategoryTab[];
    getMailSettings: () => MailSettings;
    getContactEmails: () => ContactEmail[];
    /** Resolves with the saved contact, whose `ContactEmails` carry the id a contact reference is minted from. */
    saveVCardContact: (
        contactID: string | undefined,
        vCardContact: VCardContact
    ) => Promise<ContactMetadata | undefined>;
    getUserSettings: () => UserSettings;
    getUser: () => UserModel;
    getAddresses: () => Address[];
    getThemeInformation: () => ThemeInformation;
    /** Void, not a promise: the write is persisted by `ThemeInjector`'s own debounced listener. */
    setTheme: ThemeContextInterface['setTheme'];
    setViewLayout: (viewLayout: VIEW_LAYOUT) => Promise<void>;
    setViewMode: (viewMode: VIEW_MODE) => Promise<void>;
    setDensity: (density: DENSITY) => Promise<void>;
    setAutoResponder: (autoResponder: Parameters<typeof updateAutoresponder>[0]) => Promise<void>;
    updateAddress: (params: Parameters<typeof updateAddressThunk>[0]) => Promise<void>;
    applyLocation: ApplyLocation;
    applyMultipleLocations: (params: ApplyMultipleLocationsParams) => Promise<void>;
    /**
     * Resolves once the optimistic update is dispatched, so it cannot report a backend failure.
     * `selectAll` is omitted: that path awaits a confirmation modal no Lumo surface renders.
     */
    markAs: (params: Omit<MarkAsParams, 'selectAll' | 'onCheckAll'>) => Promise<void>;
    markAll: (params: Parameters<typeof markAllAction>[0]) => Promise<void>;
    snooze: (params: SnoozeProps, sourceAction: SOURCE_ACTION) => Promise<void>;
    createLabel: (params: Parameters<typeof createLabelAction>[0]) => Promise<Label>;
    updateLabel: (params: Parameters<typeof updateLabelAction>[0]) => Promise<void>;
    /** Returns the upserted filter: the server names it, and a tool mints its reference from that. */
    addFilter: (filter: CreateFilter) => Promise<Filter>;
    updateFilter: (id: string, filter: CreateFilter) => Promise<void>;
    /** Rejects with the backend's own issues, so a tool can hand the model something to correct. */
    validateSieve: (sieve: string) => Promise<void>;
    getESStatus: () => ESStatusBooleans;
    loadConversation: (conversationID: string) => Promise<unknown>;
    initializeMessage: (messageID: string, labelID: string) => Promise<void>;
    /** Opens a composer with its body already written — never sends; the user always does that. */
    composeDraft: (params: {
        action: MESSAGE_ACTIONS;
        referenceMessage: PartialMessageState;
        bodyBeforeQuote?: string;
    }) => Promise<void>;
    /**
     * What a composer will accept right now, asked BEFORE anything is changed: a call that revises both
     * the body and the recipients must refuse outright rather than commit one and fail the other.
     */
    getDraftChangeability: (composerID: string) => DraftChangeability;
    /** Replaces the body of an OPEN composer, keeping its signature and quoted conversation. */
    writeDraftBody: (composerID: string, body: string) => boolean;
    /** Retargets an OPEN composer, replacing the recipient lists it names and leaving the others alone. */
    setDraftRecipients: (composerID: string, recipients: Partial<Record<RecipientType, Recipient[]>>) => void;
}

/** Each answer is for right now: a composer that is still opening becomes changeable a moment later. */
export interface DraftChangeability {
    isOpen: boolean;
    /** The editor has finished initializing and a body writer is registered. */
    isEditorReady: boolean;
    /** The body writer can replace the text without losing the quoted conversation. */
    canReplaceBody: boolean;
    /** Its recipient lists have loaded, so new ones have something to replace. */
    canReaddress: boolean;
}

/**
 * One Mail tool, authored as a single co-located module (the "class per tool"): its
 * {@link ToolDefinition} (what the framework advertises), a {@link ToolHandler} factory bound to the
 * Mail store, and — for a mutation — the {@link CardRenderer} for its confirm card + result tile.
 * {@link buildLumoMailConfig} assembles the registered modules into the framework's config; the engine
 * only ever receives `definition` + `handler`, the UI only the `cardRenderer`.
 */
export interface MailToolModule {
    definition: ToolDefinition;
    createHandler: (deps: MailToolDeps) => ToolHandler;
    createGuide?: (deps: MailToolDeps) => string;
    cardRenderer?: CardRenderer;
}
