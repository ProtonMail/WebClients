import safeRegexLib from 'safe-regex2';
import { c } from 'ttag';

import { RegexURL } from '../utils/utils';
import { EVASIONS, LOCATION_HREFS } from './safe-regex.redos';
import type { WorkerResponse } from './safe-regex.worker';

export enum RegexSafety {
    Safe = 'safe',
    Unsafe = 'unsafe',
    Invalid = 'invalid',
}

export type SafeRegexOptions = {
    maxRefTime?: number;
    minBudget?: number;
    multiplier?: number;
    repetitions?: number;
    samples?: number;
};

const executeRegexInWorker = (
    worker: Worker,
    regex: string,
    values: string[],
    maxExecutionTime: number
): Promise<WorkerResponse> =>
    new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Regex took too much time to execute')), maxExecutionTime);

        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            clearTimeout(timeout);
            if (e.data.error !== undefined) reject(new Error(e.data.error));
            else resolve(e.data);
        };

        worker.onerror = (error) => {
            clearTimeout(timeout);
            reject(error);
        };

        worker.postMessage({ regex, values });
    });

const medianElapsed = async (
    worker: Worker,
    regex: string,
    values: string[],
    maxExecutionTime: number,
    samples: number
): Promise<number> => {
    const timings: number[] = [];
    for (let i = 0; i < samples; i++) {
        const { elapsed } = await executeRegexInWorker(worker, regex, values, maxExecutionTime);
        timings.push(elapsed ?? 0);
    }
    timings.sort((a, b) => a - b);
    const mid = Math.floor(timings.length / 2);
    return timings.length % 2 === 0 ? (timings[mid - 1] + timings[mid]) / 2 : timings[mid];
};

/** Try compile the regex and if valid test against safe-regex2 lib.
 * Returning "Safe" only means static analysis with most obvious
 * patterns is ok, not that the regex is actually safe in all situations */
export const checkRegex = (regex: string): RegexSafety => {
    try {
        new RegExp(regex);
    } catch {
        return RegexSafety.Invalid;
    }
    if (!safeRegexLib(regex)) return RegexSafety.Unsafe;
    return RegexSafety.Safe;
};

export const getRegexError = (regex: string): string | undefined => {
    switch (checkRegex(regex)) {
        case RegexSafety.Invalid:
            return c('Error').t`Regex invalid`;
        case RegexSafety.Unsafe:
            return c('Error').t`Regex unsafe`;
        default:
            return undefined;
    }
};

/**
 * @deprecated
 * Double check the input `regex` against a battery of adversarial URL strings.
 * First check with `safe-regex2` for most common costly patterns.
 * Then run both the reference regex and the input regex against all adversarial
 * values in a single worker message each, and compare the total elapsed times.
 * This is quite expensive and defensive test meant for the ui input validation
 * Not when performance is needed like for autofill domain matching
 *
 * WARNING: considering the test is complex to maintain and unconclusive, we
 * choose to not use it in production. We keep it in the code base for a while
 * to see how regex are used in production to decide. Marking it as @deprecated
 * for the time being
 *
 * If ever this was re-introduced, dont forget to restore the worker chunk
 * ignore here: applications/pass-extension/src/app/worker/chunks.ts */
export const safeRegex = async (
    regex: string,
    { maxRefTime = 500, minBudget = 5, multiplier = 10, repetitions = 25, samples = 3 }: SafeRegexOptions = {}
): Promise<RegexSafety> => {
    const check = checkRegex(regex);
    if (check !== RegexSafety.Safe) return check;

    // const worker = new Worker(new URL('./safe-regex.worker.ts', import.meta.url));
    // Comment out woker runner so it doesnt create a chunk that webpack has to deal with
    // Restore the original code if your want to revive that part
    const worker: any = null;

    const adversarialValues = [
        ...Object.values(LOCATION_HREFS),
        ...EVASIONS.map(({ adversarial }) => adversarial(repetitions)),
    ];

    try {
        const refElapsed = await medianElapsed(worker, RegexURL.source, adversarialValues, maxRefTime, samples);
        const budget = Math.max(refElapsed * multiplier, minBudget);
        await executeRegexInWorker(worker, regex, adversarialValues, budget);
        return RegexSafety.Safe;
    } catch {
        return RegexSafety.Unsafe;
    } finally {
        worker.terminate();
    }
};
