import { c } from 'ttag';

import { IcBrandProton } from '@proton/icons/icons/IcBrandProton';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import type {
    JSONSchema,
    ToolDefinition,
    ToolHandler,
    ToolHandlers,
    ToolName,
} from '@proton/llm/lib/lumoAgent/contracts/types';
import { createLoadGuideDefinition } from '@proton/llm/lib/lumoAgent/engine/loadGuide';
import type { CardRenderers, LumoAgentConfig } from '@proton/llm/lib/lumoAgent/ui/types';
import { LumoClientType } from '@proton/lumo-api-client/types-api';
import { getTimezone } from '@proton/shared/lib/date/timezone';

import { buildStandaloneMailSearchGuide } from './guides/searchGuide';
import { STANDALONE_PROTON_SIEVE_DIALECT_REFERENCE } from './guides/sieveGuide';
import { buildMailContext } from './mailContext';
import { MAIL_RULES } from './rules';
import { createDraftModule } from './skills/compose/createDraft';
import { reviseDraftModule } from './skills/compose/reviseDraft';
import { createFilterModule } from './skills/filters/createFilter';
import { updateFilterModule } from './skills/filters/updateFilter';
import { addContactModule } from './skills/organise/addContact';
import { applyLabelsModule } from './skills/organise/applyLabels';
import { createFolderModule, createLabelModule } from './skills/organise/createEntity';
import { MOVE_LOCATIONS, moveEmailsModule } from './skills/organise/moveEmails';
import { renameFolderModule } from './skills/organise/renameFolder';
import { renameLabelModule } from './skills/organise/renameLabel';
import { INBOX_CATEGORIES, setLocationReadModule } from './skills/organise/setLocationRead';
import { setReadModule } from './skills/organise/setRead';
import { setStarredModule } from './skills/organise/setStarred';
import { snoozeEmailsModule } from './skills/organise/snoozeEmails';
import { updateContactModule } from './skills/organise/updateContact';
import { findContactsModule } from './skills/reads/findContacts';
import { listFiltersModule } from './skills/reads/listFilters';
import { listFoldersModule } from './skills/reads/listFolders';
import { listLabelsModule } from './skills/reads/listLabels';
import { MAILBOX_FILTERS, MAILBOX_SORTS } from './skills/reads/mailboxView';
import { OPEN_FOLDER_LOCATIONS, openFolderModule } from './skills/reads/openFolder';
import { readComposerModule } from './skills/reads/readComposer';
import { readEmailModule } from './skills/reads/readEmail';
import { readOpenEmailModule } from './skills/reads/readOpenEmail';
import { readThreadModule } from './skills/reads/readThread';
import { searchModule } from './skills/reads/search';
import { viewEmailsModule } from './skills/reads/viewEmails';
import { readAutoReplyModule, setAutoReplyModule } from './skills/settings/autoReply';
import { CosmeticSetting, changeSettingsModule, readSettingsModule } from './skills/settings/cosmetic';
import { changeSignatureModule, readSignatureModule, removeSignatureModule } from './skills/settings/signature';
import { openSupportTicketModule } from './skills/support/openSupportTicket';
import type { LumoMailConfigTelemetry } from './telemetry/useLumoMailTelemetry';
import type { MailToolDeps, MailToolModule } from './toolModule';
import { WELCOME_SUGGESTIONS } from './welcomeSuggestions';

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
    readComposerModule,
    listFoldersModule,
    listLabelsModule,
    listFiltersModule,
    findContactsModule,
    readSettingsModule,
    readAutoReplyModule,
    readSignatureModule,
    // Mutations
    moveEmailsModule,
    setStarredModule,
    setReadModule,
    applyLabelsModule,
    setLocationReadModule,
    createFolderModule,
    createLabelModule,
    snoozeEmailsModule,
    renameFolderModule,
    renameLabelModule,
    addContactModule,
    updateContactModule,
    // Filters
    createFilterModule,
    updateFilterModule,
    // Settings
    changeSettingsModule,
    setAutoReplyModule,
    changeSignatureModule,
    removeSignatureModule,
    // Compose
    createDraftModule,
    reviseDraftModule,
    // Support
    openSupportTicketModule,
];

/**
 * Report how a tool run went, and leave the run itself alone. The rethrow is the point: the error is
 * what the engine feeds back to the model, so swallowing it would cost more than the measurement is worth.
 */
const withToolTelemetry =
    ({ name, kind }: ToolDefinition, handler: ToolHandler, telemetry: LumoMailConfigTelemetry): ToolHandler =>
    async (params, toolDeps) => {
        try {
            const result = await handler(params, toolDeps);
            telemetry.toolSucceeded(name, kind);
            return result;
        } catch (error) {
            telemetry.toolFailed(name, kind);
            throw error;
        }
    };

/** The standalone prompt's guides, rewritten to sit beside its own parameter descriptions. */
const STANDALONE_GUIDES: Partial<Record<ToolName, (deps: MailToolDeps) => string>> = {
    search: (mail) => buildStandaloneMailSearchGuide(mail.getESStatus()),
    create_filter: () => STANDALONE_PROTON_SIEVE_DIALECT_REFERENCE,
    update_filter: () => STANDALONE_PROTON_SIEVE_DIALECT_REFERENCE,
};

/** Closed parameter vocabularies, sent as schema enums only with the standalone prompt, which lists them too. */
const STANDALONE_ENUMS: Partial<Record<ToolName, Record<string, readonly unknown[]>>> = {
    move_emails: { location: [...MOVE_LOCATIONS, null] },
    open_folder: {
        location: [...OPEN_FOLDER_LOCATIONS, null],
        filter: [...MAILBOX_FILTERS, null],
        sort: [...MAILBOX_SORTS, null],
    },
    set_location_read: { location: [...OPEN_FOLDER_LOCATIONS, null], category: [...INBOX_CATEGORIES, null] },
    search: { filter: [...MAILBOX_FILTERS, null] },
    change_settings: { setting: Object.values(CosmeticSetting) },
};

const withEnums = (schema: JSONSchema, enums: Record<string, readonly unknown[]>): JSONSchema => ({
    ...schema,
    properties: {
        ...schema.properties,
        ...Object.fromEntries(
            Object.entries(enums).map(([key, values]) => [key, { ...schema.properties[key], enum: values }])
        ),
    },
});

/**
 * The standalone prompt's `<functions>` block, served by the Lumo backend, describes every tool, so the definitions
 * carry no prose of their own. Their schemas must match that block.
 */
const toStandaloneDefinition = (
    { toolDescription, examples, ...definition }: ToolDefinition,
    deps: MailToolDeps
): ToolDefinition => {
    const guide = STANDALONE_GUIDES[definition.name];
    const enums = STANDALONE_ENUMS[definition.name];

    return {
        ...definition,
        ...(guide && { guide: () => guide(deps) }),
        ...(enums && { paramsSchema: withEnums(definition.paramsSchema, enums) }),
    };
};

/**
 * A rejected argument check is a failed run too: before `checkParams` existed, the same rejections were
 * thrown by the handler and counted there.
 */
const withCheckTelemetry = (definition: ToolDefinition, telemetry: LumoMailConfigTelemetry): ToolDefinition => {
    const { name, kind, checkParams } = definition;
    if (!checkParams) {
        return definition;
    }

    return {
        ...definition,
        checkParams: (params) => {
            try {
                checkParams(params);
            } catch (error) {
                telemetry.toolFailed(name, kind);
                throw error;
            }
        },
    };
};

/**
 * Assemble the {@link LumoAgentConfig} handed to `useLumoAgent`, binding every handler to the Mail
 * store via `deps`. Called ONCE from the provider (deps read current values through getters/methods, so
 * the built config stays referentially stable across renders — the hook rebuilds its executor only when
 * the config identity changes). `standalonePrompt` drops the composed prompt and calls as the Lumo Mail
 * client, whose standalone system prompt the Lumo backend serves.
 */
export const buildLumoMailConfig = (
    deps: MailToolDeps,
    telemetry: LumoMailConfigTelemetry,
    standalonePrompt: boolean
): LumoAgentConfig => {
    const definitions: ToolDefinition[] = MODULES.map(({ definition: rawDefinition, createGuide }) => {
        const definition = withCheckTelemetry(rawDefinition, telemetry);
        if (!createGuide) {
            return definition;
        }
        // needsGuide too: a guide is only ever reachable through `load_guide`.
        return { ...definition, needsGuide: true, guide: () => createGuide(deps) };
    });

    const handlers: ToolHandlers = Object.fromEntries(
        MODULES.map(({ definition, createHandler }) => [
            definition.name,
            withToolTelemetry(definition, createHandler(deps), telemetry),
        ])
    );

    const cardRenderers: CardRenderers = Object.fromEntries(
        MODULES.filter((module) => module.cardRenderer).map((module) => [module.definition.name, module.cardRenderer])
    );

    // Framework-owned and executor-handled, so it contributes a definition but no handler.
    const loadGuide = createLoadGuideDefinition(definitions);
    const allDefinitions = loadGuide ? [...definitions, loadGuide] : definitions;

    const prompt: Pick<
        LumoAgentConfig,
        'definitions' | 'productRules' | 'serverPrompt' | 'clientType' | 'turnContext'
    > = standalonePrompt
        ? {
              definitions: allDefinitions.map((definition) => toStandaloneDefinition(definition, deps)),
              serverPrompt: true,
              clientType: LumoClientType.LumoMail,
              turnContext: () => buildMailContext(deps.store.getState(), new Date(), getTimezone()),
          }
        : { definitions: allDefinitions, productRules: () => MAIL_RULES };

    return {
        ...prompt,
        handlers,
        cardRenderers,
        suggestions: WELCOME_SUGGESTIONS,
        telemetry,
        showContextLimitToast: true,
        // Run backend-side, so unlike MODULES they contribute no handler and no card — opt-in plus wording.
        serverTools: ['web_search', 'proton_info'],
        serverToolMeta: {
            web_search: { label: () => c('Info').t`Searched the web`, icon: IcGlobe },
            proton_info: { label: () => c('Info').t`Checked Proton support`, icon: IcBrandProton },
        },
    };
};
