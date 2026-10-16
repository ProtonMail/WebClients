import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition } from '@proton/llm/lib/lumoAgent/contracts/types';
import { LOAD_GUIDE_TOOL_NAME, resolveGuide } from '@proton/llm/lib/lumoAgent/engine/loadGuide';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { LumoClientType } from '@proton/lumo-api-client/types-api';
import { getTimezone } from '@proton/shared/lib/date/timezone';

import { setupStore } from '../store/store';
import { buildMailSearchGuide, buildStandaloneMailSearchGuide } from './guides/searchGuide';
import { PROTON_SIEVE_DIALECT_REFERENCE, STANDALONE_PROTON_SIEVE_DIALECT_REFERENCE } from './guides/sieveGuide';
import { indexedESStatus } from './helpers/navigation.test.helpers';
import { buildMailContext } from './mailContext';
import { buildLumoMailConfig } from './registry';
import { MAIL_RULES } from './rules';
import { createFilterModule } from './skills/filters/createFilter';
import { updateFilterModule } from './skills/filters/updateFilter';
import { MOVE_LOCATIONS, moveEmailsModule } from './skills/organise/moveEmails';
import { INBOX_CATEGORIES, setLocationReadModule } from './skills/organise/setLocationRead';
import { MAILBOX_FILTERS, MAILBOX_SORTS } from './skills/reads/mailboxView';
import { OPEN_FOLDER_LOCATIONS, openFolderModule } from './skills/reads/openFolder';
import { searchModule } from './skills/reads/search';
import { CosmeticSetting, changeSettingsModule } from './skills/settings/cosmetic';
import type { LumoMailConfigTelemetry } from './telemetry/useLumoMailTelemetry';
import type { MailToolDeps, MailToolModule } from './toolModule';

const buildConfig = (getFolders: MailToolDeps['getFolders']) => {
    const telemetry: LumoMailConfigTelemetry = {
        promptSent: jest.fn(),
        chainEnded: jest.fn(),
        confirmAnswered: jest.fn(),
        toolSucceeded: jest.fn(),
        toolFailed: jest.fn(),
    };
    const { handlers } = buildLumoMailConfig({ getFolders } as MailToolDeps, telemetry, false);

    return { telemetry, runListFolders: () => handlers.list_folders!({}, { references: createReferenceRegistry() }) };
};

describe('the telemetry wrapper around every Mail tool handler', () => {
    it('reports a handler that returned, under its own name and kind', async () => {
        const { telemetry, runListFolders } = buildConfig(() => []);

        await runListFolders();

        expect(telemetry.toolSucceeded).toHaveBeenCalledWith('list_folders', 'read');
        expect(telemetry.toolFailed).not.toHaveBeenCalled();
    });

    // The rethrow is the assertion that matters: the error is what the engine feeds back to the model,
    // so a wrapper that swallowed it would cost far more than the measurement is worth.
    it('reports a handler that threw and still rejects to the caller', async () => {
        const refused = new Error('the mailbox refused that');
        const { telemetry, runListFolders } = buildConfig(() => {
            throw refused;
        });

        await expect(runListFolders()).rejects.toBe(refused);

        expect(telemetry.toolFailed).toHaveBeenCalledWith('list_folders', 'read');
        expect(telemetry.toolSucceeded).not.toHaveBeenCalled();
    });
});

describe('the telemetry wrapper around a tool argument check', () => {
    const createDraftCheck = () => {
        const telemetry: LumoMailConfigTelemetry = {
            promptSent: jest.fn(),
            chainEnded: jest.fn(),
            confirmAnswered: jest.fn(),
            toolSucceeded: jest.fn(),
            toolFailed: jest.fn(),
        };
        const { definitions } = buildLumoMailConfig({} as MailToolDeps, telemetry, false);
        const checkParams = definitions.find((definition) => definition.name === 'create_draft')!.checkParams!;

        return { telemetry, checkParams };
    };

    it('reports a rejected check as a failed run and still throws to the engine', () => {
        const { telemetry, checkParams } = createDraftCheck();

        expect(() => checkParams({ kind: 'new', to: ['ada@example.com'], body: ' ' })).toThrow(ToolInputError);

        expect(telemetry.toolFailed).toHaveBeenCalledWith('create_draft', 'mutation');
    });

    it('reports nothing for a check that passes', () => {
        const { telemetry, checkParams } = createDraftCheck();

        checkParams({ kind: 'new', to: ['ada@example.com'], body: 'Hi Ada' });

        expect(telemetry.toolFailed).not.toHaveBeenCalled();
        expect(telemetry.toolSucceeded).not.toHaveBeenCalled();
    });
});

const promptDeps = { getESStatus: () => indexedESStatus(), store: setupStore() } as unknown as MailToolDeps;

const buildPromptConfig = (standalonePrompt: boolean) => {
    const config = buildLumoMailConfig(promptDeps, {} as LumoMailConfigTelemetry, standalonePrompt);
    const definition = (name: string) => config.definitions.find((candidate) => candidate.name === name)!;

    return { config, definition };
};

/** Every module whose definition the standalone config changes: a guide swap or an enum overlay. */
const CHANGED_MODULES: MailToolModule[] = [
    searchModule,
    createFilterModule,
    updateFilterModule,
    moveEmailsModule,
    openFolderModule,
    setLocationReadModule,
    changeSettingsModule,
];

describe('the Mail config with the standalone prompt flag off', () => {
    const { config, definition } = buildPromptConfig(false);

    it("keeps today's composed prompt and names no client", () => {
        expect(config.productRules?.()).toBe(MAIL_RULES);
        expect(config).not.toHaveProperty('serverPrompt');
        expect(config).not.toHaveProperty('turnContext');
        expect(config).not.toHaveProperty('clientType');
    });

    it.each(CHANGED_MODULES.map((module) => [module.definition.name, module] as const))(
        'registers %s exactly as its module defines it',
        (name, { definition: moduleDefinition, createGuide }) => {
            expect(definition(name)).toEqual({
                ...moduleDefinition,
                ...(createGuide && { needsGuide: true, guide: expect.any(Function) }),
            });
        }
    );

    it('describes every tool itself', () => {
        config.definitions.forEach(({ toolDescription }) => {
            expect(toolDescription).toEqual(expect.any(String));
        });
    });

    it("loads today's guides", () => {
        expect(resolveGuide(definition('search'))).toBe(buildMailSearchGuide(indexedESStatus()));
        expect(resolveGuide(definition('create_filter'))).toBe(PROTON_SIEVE_DIALECT_REFERENCE);
        expect(resolveGuide(definition('update_filter'))).toBe(PROTON_SIEVE_DIALECT_REFERENCE);
    });
});

describe('the Mail config with the standalone prompt flag on', () => {
    const { config, definition } = buildPromptConfig(true);

    it('leaves the prompt to the backend as the Lumo Mail client, with no composed rules', () => {
        expect(config.serverPrompt).toBe(true);
        expect(config.clientType).toBe(LumoClientType.LumoMail);
        expect(config).not.toHaveProperty('productRules');
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('opens every user turn with the mail context of the moment it is sent', () => {
        jest.useFakeTimers({ now: new Date(2026, 8, 30, 9, 5) });

        expect(config.turnContext?.()).toBe(
            buildMailContext(promptDeps.store.getState(), new Date(2026, 8, 30, 9, 5), getTimezone())
        );
    });

    it('leaves every description and example to the prompt', () => {
        config.definitions.forEach((tool: ToolDefinition) => {
            expect(tool).not.toHaveProperty('toolDescription');
            expect(tool).not.toHaveProperty('examples');
        });
    });

    it('keeps everything else each tool defines, guide marking included', () => {
        // load_guide and the telemetry-wrapped checkParams are rebuilt per config, so their callbacks never
        // compare equal across two builds.
        const rest = (definitions: ToolDefinition[]) =>
            definitions
                .filter(({ name }) => name !== LOAD_GUIDE_TOOL_NAME)
                .map(({ toolDescription, examples, guide, paramsSchema, checkParams, ...kept }) => kept);

        expect(rest(config.definitions)).toEqual(rest(buildPromptConfig(false).config.definitions));
    });

    it('loads the rewritten guides', () => {
        expect(resolveGuide(definition('search'))).toBe(buildStandaloneMailSearchGuide(indexedESStatus()));
        expect(resolveGuide(definition('create_filter'))).toBe(STANDALONE_PROTON_SIEVE_DIALECT_REFERENCE);
        expect(resolveGuide(definition('update_filter'))).toBe(STANDALONE_PROTON_SIEVE_DIALECT_REFERENCE);
    });

    it.each([
        ['move_emails', 'location', [...MOVE_LOCATIONS, null]],
        ['open_folder', 'location', [...OPEN_FOLDER_LOCATIONS, null]],
        ['open_folder', 'filter', [...MAILBOX_FILTERS, null]],
        ['open_folder', 'sort', [...MAILBOX_SORTS, null]],
        ['set_location_read', 'location', [...OPEN_FOLDER_LOCATIONS, null]],
        ['set_location_read', 'category', [...INBOX_CATEGORIES, null]],
        ['search', 'filter', [...MAILBOX_FILTERS, null]],
        ['change_settings', 'setting', Object.values(CosmeticSetting)],
    ])('closes %s.%s to the values its handler accepts', (name, property, values) => {
        const moduleProperty = CHANGED_MODULES.find((module) => module.definition.name === name)!.definition
            .paramsSchema.properties[property];

        expect(definition(name).paramsSchema.properties[property]).toEqual({ ...moduleProperty, enum: values });
        expect(moduleProperty).not.toHaveProperty('enum');
    });
});
