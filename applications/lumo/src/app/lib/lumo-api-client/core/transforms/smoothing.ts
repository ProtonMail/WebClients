/* eslint-disable prefer-const */
import { sleep } from '../../../../util/date';
import type { GenerationToFrontendMessageDecrypted as M } from '../types';

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

const REFRESH_MS = 12;

const makeSmoothingTransformer = (): Transformer<M, M> => {
    let buffer = new StringDeque('');
    let rate = 0; // char/second - emission process first derivative (aka speed or velocity)
    let lastTime = Date.now();
    const stiffnessPull = 8; // stiffness constant when spring is extended
    const stiffnessPush = 1; // stiffness constant when spring is compressed
    const lag0 = 10; // chars - length of the spring at rest
    let lag = 0; // difference between arrival and emission processes, chars
    // let next_item_task = asyncio.create_task(anext(network_gen, None))
    let dampen = 10;
    let count = 0;
    let timeoutHandle: number | undefined = undefined;
    let started = false;
    let ending = false;

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
        // console.log('[smoothing] emitString: emitting ', value);
        controller.enqueue(value);
    }

    function disableTimeout() {
        clearTimeout(timeoutHandle);
        timeoutHandle = undefined;
    }

    async function flush(controller: TransformStreamDefaultController<M>) {
        // console.log('[smoothing] flush');

        // Clear scheduled invocation
        disableTimeout();

        // Simple trick to make sure we go till the end - overextend the spring by the rest length,
        // so the spring will naturally reach rest exactly at the end of the input stream
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
        // console.log(`[smoothing] ------------`);
        // console.log(`[smoothing] progress`);

        // Clear scheduled invocation
        disableTimeout();

        console.log(`[smoothing] lag = ${lag}, buffer = `, buffer.toString());

        // Calculate time advance
        const now = Date.now(); // ms
        let dt = started ? (now - lastTime) / 1000 : 0; // sec
        // if last call was a long time ago, do not make a huge leap in time, otherwise integration will be excessive
        dt = Math.min(dt, 1);
        started = true;
        lastTime = now;
        // console.log(`[smoothing] dt = ${dt} sec`);

        // Update rate based on lag:
        // Integrate first derivative with Newton first law applied to a spring mass:
        // F=ma --> dr/dt = a = F/m = F/1 = k(x-x0) = stiffness(lag - lag0)
        // console.log(`[smoothing] lag = ${lag} chars`);
        let differential = lag - lag0; // diff between the spring's rest length and the mass's actual position
        if (ending) differential += lag0;
        console.log(`[smoothing] differential = ${differential} chars`);
        const isPulling = differential > 0; // whether the mass is behind or ahead of the spring's rest length (lag0)
        console.log(`[smoothing] isPulling: ${isPulling}`);
        const stiffness = isPulling ? stiffnessPull : stiffnessPush; // selective spring pressure depending on direction
        console.log(`[smoothing] stiffness: ${stiffness}`);
        const drate = stiffness * dt * differential;
        console.log(`[smoothing] drate: ${drate}`);
        rate += drate; // integrate dr/dt
        console.log(`[smoothing] rate (pre clamp): ${rate}`);
        rate = Math.max(rate, 0); // no negative rate
        // rate = Math.max(rate, 0.1); // force a tiny rate to always advance
        // console.log(`[smoothing] rate: ${rate}`);

        // Integrate the mass's position, i.e. calculate how many chars to emit
        const dlag = (rate - dampen) * dt;
        // console.log(`[smoothing] dlag: ${dlag}`);
        const advance = Math.max(0, Math.min(dlag, lag));
        const clamped = dlag < 0 || dlag > lag;
        // console.log(`[smoothing] advance: ${advance}`);
        const newLag = lag - advance;

        const nCharsToEmit = Math.floor(buffer.length - newLag);

        const charsToEmit = buffer.popFrontMany(nCharsToEmit);
        if (nCharsToEmit > 0) {
            // console.log(`[smoothing] emitting: "${charsToEmit}"`);
            emitString(charsToEmit, controller);
        }
        // const nCharsEmitted = charsToEmit.length;
        // lag -= nCharsEmitted;
        lag = newLag;
        // console.log(`[smoothing] lag := ${lag} chars`);

        if (clamped && advance > 0) {
            rate = Math.max(0, Math.min(rate, advance / dt));
        }

        // Call again soon even if the input stream doesn't yield new data
        if (restart) {
            // console.log(`[smoothing] setting timeout`);
            disableTimeout();
            timeoutHandle = setTimeout(() => progress(controller), REFRESH_MS) as unknown as number;
        }
    }

    async function transform(value: M, controller: TransformStreamDefaultController) {
        // console.log('transform: value = ', value);
        if (value.type !== 'token_data' || value.target !== 'message') {
            // console.log('[smoothing] transform: flushing');
            await flush(controller);
            // console.log('[smoothing] transform: emitting value ', value);
            emit(value, controller);
            // console.log('[smoothing] transform: returning');
            return;
        }

        // console.log(`[smoothing] transform: appending "${value.content}", new value: "${buffer}"`);
        buffer.pushBack(value.content);
        lag += value.content.length;
        progress(controller);
    }

    return {
        transform,
        flush,
    };
};

export const makeSmoothingTransformStream = (): TransformStream<M, M> =>
    new TransformStream(makeSmoothingTransformer());
