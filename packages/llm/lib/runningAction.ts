import { GenerationConfig, WebWorkerEngine } from '@mlc-ai/web-llm';

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
        const generateProgressCallback = (_step: number, message: string) => {
            const fulltext = message.replace(/^[ \n]*Subject:[^\n]*(\n+|$)/, '');
            callback(fulltext);
        };

        this.finishedPromise = new Promise<void>((resolve: PromiseResolve, reject: PromiseReject) => {
            this.finishedPromiseSignals = { resolve, reject };
        });

        const stopStrings = ['<|', '\n[Your Name]', ...(stop || [])];
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
