import { GenerationInterruptedError } from './recovery';
import { makeRecoverableStream } from './recovery-stream';

afterEach(() => {
    jest.useRealTimers();
});

it('interrupts an idle body read and cancels its source', async () => {
    jest.useFakeTimers();
    const cancel = jest.fn();
    const reader = makeRecoverableStream(new ReadableStream({ cancel }), 1000).getReader();
    const result = reader.read();
    const assertion = expect(result).rejects.toBeInstanceOf(GenerationInterruptedError);
    await jest.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(cancel).toHaveBeenCalledTimes(1);
});

it('preserves byte content and EOF', async () => {
    const bytes = new TextEncoder().encode(': keep-alive\n\n');
    const reader = makeRecoverableStream(
        new ReadableStream({
            start(controller) {
                controller.enqueue(bytes);
                controller.close();
            },
        })
    ).getReader();
    expect(await reader.read()).toEqual({ done: false, value: bytes });
    expect(await reader.read()).toEqual({ done: true, value: undefined });
});

it('does not apply the idle deadline while the consumer applies backpressure', async () => {
    jest.useFakeTimers();
    const bytes = new TextEncoder().encode('buffered bytes');
    const reader = makeRecoverableStream(
        new ReadableStream({
            start(controller) {
                controller.enqueue(bytes);
                controller.close();
            },
        }),
        1000
    ).getReader();
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(2000);
    expect(await reader.read()).toEqual({ done: false, value: bytes });
    expect(await reader.read()).toEqual({ done: true, value: undefined });
});
