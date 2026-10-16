import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';

import { buildLumoMailConfig } from './registry';
import type { LumoMailConfigTelemetry } from './telemetry/useLumoMailTelemetry';
import type { MailToolDeps } from './toolModule';

const buildConfig = (getFolders: MailToolDeps['getFolders']) => {
    const telemetry: LumoMailConfigTelemetry = {
        promptSent: jest.fn(),
        chainEnded: jest.fn(),
        confirmAnswered: jest.fn(),
        toolSucceeded: jest.fn(),
        toolFailed: jest.fn(),
    };
    const { handlers } = buildLumoMailConfig({ getFolders } as MailToolDeps, telemetry);

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
        const { definitions } = buildLumoMailConfig({} as MailToolDeps, telemetry);
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
