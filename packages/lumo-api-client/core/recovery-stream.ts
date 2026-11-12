import { GenerationInterruptedError } from './recovery';

type Bytes = Uint8Array<ArrayBuffer>;

export function makeRecoverableStream(source: ReadableStream<Bytes>, idleTimeoutMs = 60_000): ReadableStream<Bytes> {
    const reader = source.getReader();
    let cancelled = false;
    return new ReadableStream<Bytes>({
        async pull(controller) {
            let timedOut = false;
            const timeout = setTimeout(() => {
                timedOut = true;
                controller.error(new GenerationInterruptedError());
                void reader.cancel().catch(() => undefined);
            }, idleTimeoutMs);
            try {
                const { done, value } = await reader.read();
                if (cancelled || timedOut) {
                    return;
                }
                if (done) {
                    controller.close();
                } else {
                    controller.enqueue(value);
                }
            } catch {
                if (!cancelled && !timedOut) {
                    controller.error(new GenerationInterruptedError());
                }
            } finally {
                clearTimeout(timeout);
            }
        },
        async cancel(reason) {
            cancelled = true;
            await reader.cancel(reason).catch(() => undefined);
        },
    });
}
