import type { ChargebeeInstanceConfiguration } from '../lib/types';
import { addCheckpoint, getHiddenFor } from './checkpoints';
import type { ScriptDiagnostics } from './script-diagnostics';
import { flattenScriptDiagnostics, getScriptDiagnostics, getScriptFailureReason } from './script-diagnostics';

let chargebee: any | null = null;
export function resetChargebee() {
    chargebee = null;
}

export function createChargebee(config: ChargebeeInstanceConfiguration) {
    try {
        if (chargebee) {
            return chargebee;
        }

        addCheckpoint('chargebee.init', config);
        const instance = (window as any).Chargebee.init(config);
        addCheckpoint('chargebee.init.done');
        chargebee = instance;
        return instance;
    } catch (error: any) {
        addCheckpoint('chargebee.init.error', {
            message: error?.message,
            stack: error?.stack,
        });
        throw error;
    }
}

export function getChargebeeInstance() {
    if (!chargebee) {
        throw new Error('Chargebee is not initialized');
    }

    return chargebee;
}

export function isChargebeeLoaded(): boolean {
    return !!(window as any).Chargebee;
}

export async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shorter than the overall setup limit, so a missing Chargebee is always reported as a load failure
 * rather than as "setup stalled".
 */
export const CHARGEBEE_LOAD_TIMEOUT = 40000;

function reportLoadFailure(diagnostics: ScriptDiagnostics, data: Record<string, unknown>): never {
    addCheckpoint('chargebee.load_failed', { ...flattenScriptDiagnostics(diagnostics), ...data });

    throw new Error(getScriptFailureReason(diagnostics));
}

export async function pollUntilLoaded(): Promise<void> {
    const timeStep = 500;
    const start = Date.now();
    let iterations = 0;

    const failFastIfScriptErrored = () => {
        if (window.__chargebeeScriptFailed !== true) {
            return;
        }

        reportLoadFailure(getScriptDiagnostics(), {
            elapsedMs: Date.now() - start,
            iterations,
            msPerIteration: null,
            failedBeforePolling: iterations === 0,
            hiddenFor: getHiddenFor(),
            visibility: typeof document === 'undefined' ? null : document.visibilityState,
        });
    };

    /**
     * Browsers slow timers to one per second in hidden tabs, and to one per minute in hidden or
     * offscreen frames like this one. Counting the delays we asked for instead of the time that
     * actually passed stretched this wait enormously in exactly those sessions.
     */
    do {
        failFastIfScriptErrored();

        if (isChargebeeLoaded()) {
            addCheckpoint('chargebee.loaded', { timeElapsed: Date.now() - start, iterations });
            return;
        }
        await wait(timeStep);
        iterations++;
    } while (Date.now() - start < CHARGEBEE_LOAD_TIMEOUT);

    const elapsedMs = Date.now() - start;

    reportLoadFailure(getScriptDiagnostics(), {
        elapsedMs,
        iterations,
        /** Much larger than `timeStep` means the browser slowed this frame's timers down. */
        msPerIteration: iterations === 0 ? null : Math.round(elapsedMs / iterations),
        failedBeforePolling: false,
        hiddenFor: getHiddenFor(),
        visibility: typeof document === 'undefined' ? null : document.visibilityState,
    });
}
