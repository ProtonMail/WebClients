/* eslint-disable prefer-const,no-nested-ternary */
import { sleep } from '../../../../util/date';
import type { GenerationResponseMessageDecrypted as M } from '../types';

declare global {
    interface Window {
        lumoSmoothingDebug?: {
            lag: number;
            bufferSize: number;
            differential: number;
            rate: number;
            drate: number;
            stiffness: number;
            isPulling: boolean;
        };
    }
}

class StringDeque {
    private str: string;
    private start: number = 0;

    constructor(input: string = '') {
        this.str = input;
    }

    popFront(): string {
        if (this.start >= this.str.length) return '';
        const char = this.str[this.start];
        this.start++;
        return char;
    }

    popFrontMany(count: number): string {
        if (count <= 0) return '';

        const available = this.str.length - this.start;
        const actualCount = Math.min(count, available);

        if (actualCount === 0) return '';

        const result = this.str.substring(this.start, this.start + actualCount);
        this.start += actualCount;
        return result;
    }

    pushBack(text: string): void {
        this.str += text;
    }

    peekFront(): string | undefined {
        return this.start < this.str.length ? this.str[this.start] : undefined;
    }

    get length(): number {
        return Math.max(0, this.str.length - this.start);
    }

    isEmpty(): boolean {
        return this.start >= this.str.length;
    }

    toString(): string {
        return this.str.substring(this.start);
    }

    clear(): void {
        this.str = '';
        this.start = 0;
    }
}

const REFRESH_MS = 4;
const DISABLE_SMOOTHING = false;

export const DAMPEN_RATE = 20; // smoothes sudden rate changes
export const LAG0 = 40;
export const STIFFNESS_PUSH = 8;
export const STIFFNESS_PULL = 16;
export const STIFFNESS_PULL_ENDING = 40;

const makeSmoothingTransformer = (): Transformer<M, M> => {
    let buffer = new StringDeque('');
    let rate = 0; // char/second - emission process first derivative (aka speed or velocity)
    let lastTime = Date.now();
    const stiffnessPull = STIFFNESS_PULL; // stiffness constant when spring is extended
    const stiffnessPullEnding = STIFFNESS_PULL_ENDING; // stiffness constant when spring is extended
    const stiffnessPush = STIFFNESS_PUSH; // stiffness constant when spring is compressed
    const lag0 = LAG0; // chars - length of the spring at rest
    let lag = 0; // difference between arrival and emission processes, chars
    // let next_item_task = asyncio.create_task(anext(network_gen, None))
    let dampen = DAMPEN_RATE;
    let count = 0;
    let timeoutHandle: number | undefined = undefined;
    let started = false;
    let ending = false;
    let debugEnabled = typeof window !== 'undefined' && localStorage.getItem('lumo_debug_perf') === 'true';

    function emit(value: M, controller: TransformStreamDefaultController<M>) {
        controller.enqueue(value);
        count += 1;
    }

    function emitString(s: string, controller: TransformStreamDefaultController<M>) {
        const value: M = {
            type: 'token_data',
            content: s,
            target: 'message',
            count,
        };
        controller.enqueue(value);
    }

    function disableTimeout() {
        clearTimeout(timeoutHandle);
        timeoutHandle = undefined;
    }

    async function flush(controller: TransformStreamDefaultController<M>) {
        if (DISABLE_SMOOTHING) return;

        // Clear scheduled invocation
        disableTimeout();

        // Make sure we go till the end, otherwise we'll stop when the spring is at rest length,
        // missing lag0 chars in the buffer
        ending = true;

        // Make progress manually until stream is over
        while (!buffer.isEmpty()) {
            progress(controller, false);
            await sleep(REFRESH_MS);
        }

        buffer.clear();
        count = 0;
        lag = 0;
        rate = 0;
        started = false;
        ending = false;
    }

    function progress(controller: TransformStreamDefaultController<any>, restart: boolean = true) {
        // Clear scheduled invocation
        disableTimeout();

        // Calculate time advance
        const now = Date.now(); // ms
        let dt = started ? (now - lastTime) / 1000 : 0; // sec
        // if last call was a long time ago, do not make a huge leap in time, otherwise integration will be excessive
        dt = Math.min(dt, 1);
        started = true;
        lastTime = now;

        // Update rate based on lag:
        // Integrate first derivative with Newton first law applied to a spring mass:
        // F=ma --> dr/dt = a = F/m = F/1 = k(x-x0) = stiffness(lag - lag0)
        let differential = !ending ? lag - lag0 : lag + lag0; // diff between the spring's rest length and the mass's actual position
        const isPulling = differential > 0; // whether the mass is behind or ahead of the spring's rest length (lag0)
        const stiffness = isPulling ? (!ending ? stiffnessPull : stiffnessPullEnding) : stiffnessPush; // selective spring pressure depending on direction
        const drate = (stiffness * differential - dampen * rate) * dt;
        rate += drate; // integrate dr/dt
        rate = Math.max(rate, 0); // no negative rate
        if (ending) rate = Math.max(rate, 10); // force a tiny rate to always advance

        // Integrate the mass's position, i.e. calculate how many chars to emit
        const dlag = rate * dt;
        const advance = Math.max(0, Math.min(dlag, lag));
        const clamped = dlag < 0 || dlag > lag;
        const newLag = lag - advance;

        const nCharsToEmit = Math.floor(buffer.length - newLag);

        const charsToEmit = buffer.popFrontMany(nCharsToEmit);
        if (nCharsToEmit > 0) {
            emitString(charsToEmit, controller);
        }
        lag = newLag;

        if (clamped && advance > 0) {
            rate = Math.max(0, Math.min(rate, advance / dt));
        }

        // Export debug metrics if performance monitor is enabled
        if (debugEnabled && typeof window !== 'undefined') {
            window.lumoSmoothingDebug = {
                lag,
                bufferSize: buffer.length,
                differential,
                rate,
                drate,
                stiffness,
                isPulling,
            };
        }

        // Call again soon even if the input stream doesn't yield new data
        if (restart) {
            disableTimeout();
            timeoutHandle = setTimeout(() => progress(controller), REFRESH_MS) as unknown as number;
        }
    }

    async function transform(value: M, controller: TransformStreamDefaultController) {
        if (DISABLE_SMOOTHING) {
            controller.enqueue(value);
            return;
        }

        // console.log('transform: value = ', value);
        if (value.type !== 'token_data' || value.target !== 'message') {
            await flush(controller);
            emit(value, controller);
            return;
        }

        buffer.pushBack(value.content);
        lag += value.content.length;
        progress(controller);
    }

    return {
        transform,
        flush,
    };
};

const strategy = {
    highWaterMark: 99999999,
};
export const makeSmoothingTransformStream = (enabled: boolean = true): TransformStream<M, M> =>
    enabled ? new TransformStream(makeSmoothingTransformer(), strategy, strategy) : new TransformStream(); // passthrough if disabled
