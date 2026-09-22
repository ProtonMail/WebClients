import type * as Autofill from '@protontech/autofill';
import type { ModelProvider } from '@protontech/autofill/types';

import { createModelProvider } from '@proton/pass/lib/extension/model-artifact/model-artifact';
import type { ModelArtifact } from '@proton/pass/lib/extension/model-artifact/model-artifact';
import type { MaybeNull } from '@proton/pass/types/utils/index';

import { sendMessage } from '../../../../lib/message/send-message';
import { BUNDLED_MODEL_ID } from '../../../../lib/utils/version';
import type * as DetectorService from './detector.service';

jest.mock('@protontech/autofill', () => ({
    ...jest.requireActual('@protontech/autofill'),
    createRulesetRegistry: jest.fn(() => ({ make: jest.fn(() => ({ against: jest.fn() })) })),
}));

jest.mock('../../../../lib/message/send-message', () => ({
    contentScriptMessage: jest.fn((message) => message),
    sendMessage: Object.assign(jest.fn(), {
        on: jest.fn(),
        onSuccess: jest.fn().mockResolvedValue(undefined),
    }),
}));

jest.mock('@proton/pass/lib/extension/model-artifact/model-artifact', () => ({
    createModelProvider: jest.fn(),
}));

describe('DetectorService: runtime model resolution', () => {
    const artifact = (modelId: string): ModelArtifact => ({ modelId, arch: 'lr', weights: {} }) as ModelArtifact;
    const provider = { email: {} } as unknown as ModelProvider;

    let workerResponse: { type: 'success'; artifact: MaybeNull<ModelArtifact> } | { type: 'error'; error: string };

    /** Each test needs a fresh module instance : `ruleset`/`modelId` are locked-once module state. */
    const load = async () => {
        let service: typeof DetectorService;
        let autofill: typeof Autofill;
        await jest.isolateModulesAsync(async () => {
            service = await import('./detector.service');
            autofill = await import('@protontech/autofill');
        });
        return {
            createDetectorService: service!.createDetectorService,
            createRulesetRegistry: jest.mocked(autofill!.createRulesetRegistry),
        };
    };

    beforeEach(() => {
        jest.clearAllMocks();
        workerResponse = { type: 'error', error: 'not configured' };
        (sendMessage.on as jest.Mock).mockImplementation((_message, onResponse) => onResponse(workerResponse));
        (sendMessage.onSuccess as jest.Mock).mockResolvedValue(undefined);
    });

    test('Falls back to the bundled model when the worker has no cached artifact', async () => {
        workerResponse = { type: 'success', artifact: null };
        const { createDetectorService, createRulesetRegistry } = await load();

        const detector = createDetectorService({ root: document });
        await detector.init();

        expect(detector.getModelId()).toBe(BUNDLED_MODEL_ID);
        // Bundled ruleset construction is lazy now, deferred to first detection : not built here.
        expect(createRulesetRegistry).not.toHaveBeenCalled();
    });

    test('Falls back to the bundled model when the worker message itself fails', async () => {
        workerResponse = { type: 'error', error: 'disconnected port' };
        const { createDetectorService } = await load();

        const detector = createDetectorService({ root: document });
        await detector.init();

        expect(detector.getModelId()).toBe(BUNDLED_MODEL_ID);
    });

    test('Falls back to the bundled model when the artifact fails feature-store validation', async () => {
        workerResponse = { type: 'success', artifact: artifact('2026.8.2475-lr') };
        jest.mocked(createModelProvider).mockReturnValue({ ok: false, error: 'unknown feature "foo"' });
        const { createDetectorService, createRulesetRegistry } = await load();

        const detector = createDetectorService({ root: document });
        await detector.init();

        expect(detector.getModelId()).toBe(BUNDLED_MODEL_ID);
        expect(createRulesetRegistry).not.toHaveBeenCalled();
    });

    test('Uses the runtime model once resolved and validated, without ever building the bundled ruleset', async () => {
        workerResponse = { type: 'success', artifact: artifact('2026.8.2475-lr') };
        jest.mocked(createModelProvider).mockReturnValue({ ok: true, provider });
        const { createDetectorService, createRulesetRegistry } = await load();

        const detector = createDetectorService({ root: document });
        await detector.init();

        expect(detector.getModelId()).toBe('2026.8.2475-lr');
        expect(createRulesetRegistry).toHaveBeenCalledWith({ runtime: provider });
        expect(createRulesetRegistry).toHaveBeenCalledTimes(1);
    });

    test('A detector recreated while the first resolution is still in flight awaits the same resolution', async () => {
        jest.mocked(createModelProvider).mockReturnValue({ ok: true, provider });
        const { createDetectorService } = await load();

        let releaseResponse: () => void;
        const responseGate = new Promise<void>((resolve) => (releaseResponse = resolve));
        (sendMessage.on as jest.Mock).mockImplementation(async (_message, onResponse) => {
            await responseGate;
            return onResponse({ type: 'success', artifact: artifact('2026.8.2475-lr') });
        });

        const first = createDetectorService({ root: document });
        void first.init();

        const second = createDetectorService({ root: document });
        const secondInit = second.init();
        const notYetResolved = Symbol('not yet resolved');

        // `second.init()` must not resolve early while the first resolution is still in flight.
        expect(await Promise.race([secondInit, notYetResolved])).toBe(notYetResolved);

        releaseResponse!();
        await secondInit;

        expect(second.getModelId()).toBe('2026.8.2475-lr');
    });

    test('A detector recreated within the same JS realm keeps the first-resolved model', async () => {
        workerResponse = { type: 'success', artifact: artifact('2026.8.2475-lr') };
        jest.mocked(createModelProvider).mockReturnValue({ ok: true, provider });
        const { createDetectorService, createRulesetRegistry } = await load();

        const first = createDetectorService({ root: document });
        await first.init();
        expect(first.getModelId()).toBe('2026.8.2475-lr');

        workerResponse = { type: 'success', artifact: artifact('2026.10.1-rf') };
        const second = createDetectorService({ root: document });
        await second.init();

        expect(second.getModelId()).toBe('2026.8.2475-lr');
        expect(createRulesetRegistry).toHaveBeenCalledTimes(1);
    });
});
