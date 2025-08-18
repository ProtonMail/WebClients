import type { GenerationConfig, WebWorkerEngine } from '@mlc-ai/web-llm';

import { getTransformForAction } from '@proton/llm/lib/actions';
import type { Action, GenerationCallback, PromiseReject, PromiseResolve, RunningAction } from '@proton/llm/lib/types';

export class BaseRunningAction implements RunningAction {
    private action_: Action;

    protected chat: WebWorkerEngine;

    protected running: boolean;

    protected done: boolean;

    protected cancelled: boolean;

    protected finishedPromise: Promise<void>;

    protected finishedPromiseSignals: { resolve: PromiseResolve; reject: PromiseReject } | undefined;

    // @ts-ignore
    protected generation: Promise<void>;

    constructor(prompt: string, callback: GenerationCallback, chat: WebWorkerEngine, action: Action, stop?: string[]) {
        let firstTimestamp: number | null = null;
        let lastTimestamp: number | null = null;
        let intervals: number[] = [];

        const transform = getTransformForAction(action);

        const generateProgressCallback = (_step: number, message: string) => {
            const now = Date.now();
            let slow = false;
            if (firstTimestamp === null) {
                firstTimestamp = now;
            }
            if (lastTimestamp !== null) {
                const intervalMs = now - lastTimestamp;
                const elapsedMs = now - firstTimestamp;
                const elapsedSec = elapsedMs / 1000;
                intervals = [...intervals, intervalMs].slice(-10);
                const meanIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                const meanIntervalSec = meanIntervalMs / 1000.0;
                const tokenPerSec = 1.0 / meanIntervalSec;
                slow = elapsedSec > 5 && tokenPerSec < 2;
            }
            lastTimestamp = now;

            const fulltext = transform(message);
            const harmful = fulltext === undefined;
            callback(fulltext || '', { slow, harmful });
        };

        this.finishedPromise = new Promise<void>((resolve: PromiseResolve, reject: PromiseReject) => {
            this.finishedPromiseSignals = { resolve, reject };
        });

        const stopStrings = ['<|', '\n[Your Name]\n', ...(stop || [])];
        const genConfig: GenerationConfig = {
            stop: stopStrings,
        };

        this.generation = chat
            .generate(prompt, generateProgressCallback, undefined, genConfig)
            .then(() => {
                this.finishedPromiseSignals!.resolve();
            })
            .catch((e) => {
                this.done = true;
                this.finishedPromiseSignals!.reject(e);
            })
            .finally(async () => {
                this.running = false;
                await chat.resetChat();
            });

        this.chat = chat;
        this.running = true;
        this.done = false;
        this.cancelled = false;
        this.action_ = action;
    }

    action(): Action {
        return this.action_;
    }

    isRunning(): boolean {
        return this.running;
    }

    isDone(): boolean {
        return this.done;
    }

    isCancelled(): boolean {
        return this.cancelled;
    }

    cancel(): boolean {
        if (this.running) {
            this.chat.interruptGenerate();
            this.running = false;
            this.done = false;
            this.cancelled = true;
            return true;
        }
        return false;
    }

    waitForCompletion(): Promise<void> {
        return this.finishedPromise;
    }
}
