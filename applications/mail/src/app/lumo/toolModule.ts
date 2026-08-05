import type { History } from 'history';

import type { CardRenderer } from '@proton/components/components/lumoAgent/types';
import type { Filter } from '@proton/components/containers/filters/interfaces';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { Folder, Label, MailSettings } from '@proton/shared/lib/interfaces';

import type {
    ApplyLocationLabelProps,
    ApplyLocationMoveProps,
    ApplyLocationStarProps,
} from 'proton-mail/hooks/actions/applyLocation/interface';
import type { MailStore } from 'proton-mail/store/store';

/** The apply-location mutation, as exposed by `useApplyLocation` — the one store mutation MR7 drives. */
export type ApplyLocation = (
    params: ApplyLocationMoveProps | ApplyLocationLabelProps | ApplyLocationStarProps
) => Promise<PromiseSettledResult<string | undefined>[]>;

/**
 * Read-only store access — the only two members a tool ever needs. Tools never dispatch: a mutation
 * goes through {@link ApplyLocation} so it runs the same optimistic/undo path as the UI, so narrowing
 * here turns an accidental `mail.store.dispatch(...)` into a compile error.
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
    loadConversation: (conversationID: string) => Promise<unknown>;
    initializeMessage: (messageID: string, labelID: string) => Promise<void>;
}

/**
 * One Mail tool, authored as a single co-located module (the "class per tool"): its pure
 * {@link ToolDefinition} (data the framework advertises), a {@link ToolHandler} factory bound to the
 * Mail store, and — for a mutation — the {@link CardRenderer} for its confirm card + result tile.
 * {@link buildLumoMailConfig} assembles the registered modules into the framework's config; the pure
 * engine only ever receives `definition` + `handler`, the UI only the `cardRenderer`.
 */
export interface MailToolModule {
    definition: ToolDefinition;
    createHandler: (deps: MailToolDeps) => ToolHandler;
    cardRenderer?: CardRenderer;
}
