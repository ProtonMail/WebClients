import type { CardRenderers, LumoAgentConfig } from '@proton/components/components/lumoAgent/types';
import type { ToolDefinition, ToolHandlers } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createLoadGuideDefinition } from '@proton/llm/lib/lumoAgent/engine/loadGuide';

import { MAIL_RULES } from './rules';
import { moveEmailsModule } from './skills/organise/moveEmails';
import { setStarredModule } from './skills/organise/setStarred';
import { listFiltersModule } from './skills/reads/listFilters';
import { listFoldersModule } from './skills/reads/listFolders';
import { listLabelsModule } from './skills/reads/listLabels';
import { openFolderModule } from './skills/reads/openFolder';
import { readEmailModule } from './skills/reads/readEmail';
import { readOpenEmailModule } from './skills/reads/readOpenEmail';
import { readThreadModule } from './skills/reads/readThread';
import { searchModule } from './skills/reads/search';
import { viewEmailsModule } from './skills/reads/viewEmails';
import type { MailToolDeps, MailToolModule } from './toolModule';

/**
 * The Mail tool pack. Each entry is a self-contained module (definition + handler factory + optional
 * card renderer — see {@link MailToolModule}); adding a tool means adding it here and nowhere else.
 * {@link buildLumoMailConfig} splits the modules back into the layered inputs the framework expects:
 * definitions for the engine, store-bound handlers for dispatch, card renderers for the UI.
 */
const MODULES: MailToolModule[] = [
    // Reads
    viewEmailsModule,
    openFolderModule,
    searchModule,
    readEmailModule,
    readOpenEmailModule,
    readThreadModule,
    listFoldersModule,
    listLabelsModule,
    listFiltersModule,
    // Mutations
    moveEmailsModule,
    setStarredModule,
];

/**
 * Assemble the {@link LumoAgentConfig} handed to `useLumoAgent`, binding every handler to the Mail
 * store via `deps`. Called ONCE from the provider (deps read current values through getters/methods, so
 * the built config stays referentially stable across renders — the hook rebuilds its executor only when
 * the config identity changes).
 */
export const buildLumoMailConfig = (deps: MailToolDeps): LumoAgentConfig => {
    const definitions: ToolDefinition[] = MODULES.map(({ definition, createGuide }) => {
        if (!createGuide) {
            return definition;
        }
        // needsGuide too: a guide is only ever reachable through `load_guide`.
        return { ...definition, needsGuide: true, guide: () => createGuide(deps) };
    });

    const handlers: ToolHandlers = Object.fromEntries(
        MODULES.map((module) => [module.definition.name, module.createHandler(deps)])
    );

    const cardRenderers: CardRenderers = Object.fromEntries(
        MODULES.filter((module) => module.cardRenderer).map((module) => [module.definition.name, module.cardRenderer])
    );

    // Framework-owned and executor-handled, so it contributes a definition but no handler.
    const loadGuide = createLoadGuideDefinition(definitions);

    return {
        definitions: loadGuide ? [...definitions, loadGuide] : definitions,
        handlers,
        cardRenderers,
        productRules: MAIL_RULES,
    };
};
