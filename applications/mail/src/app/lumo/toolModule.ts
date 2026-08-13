import type { History } from 'history';

import type { CardRenderer } from '@proton/components/components/lumoAgent/types';
import type { Filter } from '@proton/components/containers/filters/interfaces';
import type { ESStatusBooleans } from '@proton/encrypted-search/models';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import type {
    createLabel as createLabelAction,
    updateLabel as updateLabelAction,
} from '@proton/mail/store/labels/actions';
import type { Folder, Label, MailSettings } from '@proton/shared/lib/interfaces';

import type { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import type {
    ApplyLocationLabelProps,
    ApplyLocationMoveProps,
    ApplyLocationStarProps,
    ApplyMultipleLocationsParams,
} from 'proton-mail/hooks/actions/applyLocation/interface';
import type { MarkAsParams } from 'proton-mail/hooks/actions/markAs/useMarkAs';
import type { SnoozeProps } from 'proton-mail/hooks/actions/useSnooze';
import type { markAll as markAllAction } from 'proton-mail/store/elements/elementsActions';
import type { MailStore } from 'proton-mail/store/store';

/** The single-location apply mutation, as exposed by `useApplyLocation`. */
export type ApplyLocation = (
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
    getMailSettings: () => MailSettings;
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
    getESStatus: () => ESStatusBooleans;
    loadConversation: (conversationID: string) => Promise<unknown>;
    initializeMessage: (messageID: string, labelID: string) => Promise<void>;
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
