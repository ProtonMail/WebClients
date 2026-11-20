import type * as Autofill from '@protontech/autofill';
import type { ModelProvider } from '@protontech/autofill/types';
import type { Mock } from 'vitest';

import { createModelProvider } from '@proton/pass/lib/extension/model-artifact/model-artifact';
import type { ModelArtifact } from '@proton/pass/lib/extension/model-artifact/model-artifact';
import type { MaybeNull } from '@proton/pass/types/utils';

import { sendMessage } from '../../../../lib/message/send-message';
import { BUNDLED_MODEL_ID } from '../../../../lib/utils/version';
import type * as DetectorService from './detector.service';

vi.mock('@protontech/autofill', async () => ({
    ...(await vi.importActual('@protontech/autofill')),
    createRulesetRegistry: vi.fn(() => ({ make: vi.fn(() => ({ against: vi.fn() })) })),
}));

vi.mock('../../../../lib/message/send-message', async () => ({
    contentScriptMessage: vi.fn((message) => message),
    sendMessage: Object.assign(vi.fn(), {
        on: vi.fn(),
        onSuccess: vi.fn().mockResolvedValue(undefined),
    }),
}));

vi.mock('@proton/pass/lib/extension/model-artifact/model-artifact', async () => ({
    createModelProvider: vi.fn(),
}));

describe('DetectorService: runtime model resolution', () => {
    const artifact = (modelId: string): ModelArtifact => ({ modelId, arch: 'rf', weights: {} }) as ModelArtifact;
    const provider = { email: {} } as unknown as ModelProvider;

    let workerResponse: { type: 'success'; artifact: MaybeNull<ModelArtifact> } | { type: 'error'; error: string };

    /** Each test needs a fresh module instance : `ruleset`/`modelId` are locked-once module state. */
    const load = async () => {
        vi.resetModules();
        const service: typeof DetectorService = await import('./detector.service');
        const autofill: typeof Autofill = await import('@protontech/autofill');
        return {
            createDetectorService: service.createDetectorService,
            createRulesetRegistry: vi.mocked(autofill.createRulesetRegistry),
        };
    };

    beforeEach(() => {
        vi.clearAllMocks();
        workerResponse = { type: 'error', error: 'not configured' };
        (sendMessage.on as Mock).mockImplementation((_message, onResponse) => onResponse(workerResponse));
        (sendMessage.onSuccess as Mock).mockResolvedValue(undefined);
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
        vi.mocked(createModelProvider).mockReturnValue({ ok: false, error: 'unknown feature "foo"' });
        const { createDetectorService, createRulesetRegistry } = await load();

        const detector = createDetectorService({ root: document });
        await detector.init();

        expect(detector.getModelId()).toBe(BUNDLED_MODEL_ID);
        expect(createRulesetRegistry).not.toHaveBeenCalled();
    });

    test('Uses the runtime model once resolved and validated, without ever building the bundled ruleset', async () => {
        workerResponse = { type: 'success', artifact: artifact('2026.8.2475-lr') };
        vi.mocked(createModelProvider).mockReturnValue({ ok: true, provider });
        const { createDetectorService, createRulesetRegistry } = await load();

        const detector = createDetectorService({ root: document });
        await detector.init();

        expect(detector.getModelId()).toBe('2026.8.2475-lr');
        expect(createRulesetRegistry).toHaveBeenCalledWith({ runtime: provider });
        expect(createRulesetRegistry).toHaveBeenCalledTimes(1);
    });

    test('A detector recreated while the first resolution is still in flight awaits the same resolution', async () => {
        vi.mocked(createModelProvider).mockReturnValue({ ok: true, provider });
        const { createDetectorService } = await load();

        let releaseResponse: () => void;
        const responseGate = new Promise<void>((resolve) => (releaseResponse = resolve));
        (sendMessage.on as Mock).mockImplementation(async (_message, onResponse) => {
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
        vi.mocked(createModelProvider).mockReturnValue({ ok: true, provider });
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
