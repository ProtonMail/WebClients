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
