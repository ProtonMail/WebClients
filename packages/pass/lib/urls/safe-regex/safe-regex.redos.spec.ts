import { Worker as NodeWorker } from 'worker_threads';

import { RegexSafety, safeRegex } from './safe-regex';
import { EVASIONS } from './safe-regex.redos';

/** Reuse real worker code would be better but it's technically complicated */
const WORKER_CODE = `
const { parentPort } = require('worker_threads');
const { performance } = require('perf_hooks');

parentPort.on('message', ({ regex, values }) => {
    try {
        const re = new RegExp(regex);
        const start = performance.now();
        for (const value of values) {
            re.test(value);
        }
        const elapsed = performance.now() - start;
        parentPort.postMessage({ elapsed });
    } catch (error) {
        parentPort.postMessage({ error: String(error) });
    }
});
`;

class RealWorker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    private node: InstanceType<typeof NodeWorker>;

    constructor(_url: URL) {
        this.node = new NodeWorker(WORKER_CODE, { eval: true });
        this.node.on('message', (data) => this.onmessage?.({ data } as MessageEvent));
        this.node.on('error', (err) => this.onerror?.(err as ErrorEvent));
    }

    postMessage(data: unknown) {
        this.node.postMessage(data);
    }

    terminate() {
        void this.node.terminate();
    }
}

// Skip those tests as long as they are unused in production
// Check safeRegex comment
describe.skip('safeRegex ReDoS detection', () => {
    beforeAll(() => {
        global.Worker = RealWorker as unknown as typeof Worker;
    });

    test.each([/^https?:\/\/proton\.me.*$/, /^https?:\/\/\w\.proton\.me$/, /.*/])(
        'detects "$name" as Safe',
        async (re) => {
            const result = await safeRegex(re.source);
            expect(result).toBe(RegexSafety.Safe);
        }
    );

    test.each(EVASIONS)('detects "$name" as Unsafe', async ({ re }) => {
        const result = await safeRegex(re.source, { repetitions: 40 });
        expect(result).toBe(RegexSafety.Unsafe);
    });
});
