import { observeEvents } from './events';
import type { ChallengeEvent, ChallengeLog, ChallengeLogType, ChallengeRef, ChallengeResult } from './interface';

const ERROR_TIMEOUT_MS = 15000;
const CHALLENGE_TIMEOUT_MS = ERROR_TIMEOUT_MS + 9000;
const MAX_QUEUED_EVENTS = 500;
const MAX_LOGS = 20;

type Stage = 'initialize' | 'initialized' | 'loaded' | 'error' | 'destroyed';

interface ChallengeFrameControllerOptions {
    iframe: HTMLIFrameElement;
    src: string;
    onSuccess?: () => void;
    onError?: (logs: ChallengeLog[]) => void;
    errorTimeout?: number;
    challengeTimeout?: number;
}

/** Frame protocol without React; `ChallengeFrame` wires lifecycle. */
class ChallengeFrameController implements ChallengeRef {
    private readonly options: ChallengeFrameControllerOptions;

    private readonly targetOrigin: string;

    private readonly searchParams: string;

    private stage: Stage = 'initialize';

    private logs: ChallengeLog[] = [];

    private errored = false;

    private errorTimeoutHandle: number | undefined;

    private queue: ChallengeEvent[] = [];

    private flushHandle: number | undefined;

    private challengeResolve: ((data: ChallengeResult) => void) | undefined;

    private challengeReject: ((error: any) => void) | undefined;

    private challengeTimeoutHandle: number | undefined;

    private observed: HTMLElement | undefined;

    private unobserve: (() => void) | undefined;

    constructor(options: ChallengeFrameControllerOptions) {
        this.options = options;
        this.targetOrigin = new URL(options.src).origin;
        this.searchParams = new URL(options.src).searchParams.toString();

        window.addEventListener('message', this.handleMessage);
        this.addLog('Added listener', undefined, 'step');

        this.errorTimeoutHandle = window.setTimeout(() => {
            this.addLog('Initial iframe timeout', undefined, 'error');
            this.handleError();
        }, options.errorTimeout ?? ERROR_TIMEOUT_MS);
    }

    observe = (el: HTMLElement | null | undefined) => {
        if (el === this.observed || this.stage === 'destroyed') {
            return;
        }
        this.unobserve?.();
        this.observed = el ?? undefined;
        this.unobserve = el ? observeEvents(el, this.sendEvent) : undefined;
    };

    sendEvent = (event: ChallengeEvent) => {
        if (this.errored || this.stage === 'destroyed') {
            return;
        }

        this.queue.push(event);
        if (this.queue.length > MAX_QUEUED_EVENTS) {
            this.queue.splice(0, this.queue.length - MAX_QUEUED_EVENTS);
        }

        if (this.stage === 'loaded') {
            this.scheduleFlush();
        }
    };

    getChallenge = () => {
        if (this.stage === 'destroyed') {
            return Promise.reject(new Error('Challenge unmounted'));
        }
        if (this.errored) {
            return Promise.reject(new Error('Challenge failed'));
        }

        this.challengeReject?.(new Error('Challenge abandoned'));
        this.clearChallengeRequest();

        return new Promise<ChallengeResult>((resolve, reject) => {
            this.challengeResolve = resolve;
            this.challengeReject = reject;
            if (this.stage === 'loaded') {
                this.requestChallenge();
            }
            this.challengeTimeoutHandle = window.setTimeout(() => {
                this.clearChallengeRequest();
                reject(new Error('Challenge timeout'));
            }, this.options.challengeTimeout ?? CHALLENGE_TIMEOUT_MS);
        });
    };

    destroy = () => {
        window.removeEventListener('message', this.handleMessage);
        clearTimeout(this.errorTimeoutHandle);
        this.discardQueue();
        this.unobserve?.();
        this.unobserve = undefined;
        this.observed = undefined;
        this.stage = 'destroyed';
        this.settleChallengeRequest(new Error('Challenge unmounted'));
    };

    private get contentWindow() {
        return this.options.iframe.contentWindow;
    }

    private addLog(text: string, data: unknown, type: ChallengeLogType) {
        if (this.logs.length >= MAX_LOGS) {
            return;
        }
        const log: ChallengeLog = {
            type,
            text: `${new Date().toISOString()} ${text} ${this.searchParams}`,
        };
        if (data) {
            log.data = data;
        }
        this.logs.push(log);
    }

    private handleError() {
        if (this.errored || this.stage === 'destroyed') {
            return;
        }
        this.errored = true;
        this.stage = 'error';
        this.discardQueue();
        this.settleChallengeRequest(new Error('Challenge failed'));
        this.options.onError?.(this.logs);
    }

    private clearChallengeRequest() {
        clearTimeout(this.challengeTimeoutHandle);
        this.challengeTimeoutHandle = undefined;
        this.challengeResolve = undefined;
        this.challengeReject = undefined;
    }

    private settleChallengeRequest(error: Error) {
        const reject = this.challengeReject;
        this.clearChallengeRequest();
        reject?.(error);
    }

    private discardQueue() {
        clearTimeout(this.flushHandle);
        this.flushHandle = undefined;
        this.queue = [];
    }

    private scheduleFlush() {
        if (this.flushHandle === undefined) {
            this.flushHandle = window.setTimeout(this.flush, 0);
        }
    }

    private post(message: unknown) {
        this.contentWindow?.postMessage(message, this.targetOrigin);
    }

    private flush = () => {
        clearTimeout(this.flushHandle);
        this.flushHandle = undefined;
        if (!this.queue.length || this.stage !== 'loaded') {
            return;
        }
        const payload = this.queue;
        this.queue = [];
        this.post({ type: 'events', payload });
    };

    private requestChallenge() {
        // Queued keystrokes must flush before submit.broadcast; postMessage preserves order.
        this.flush();
        this.post({
            type: 'env.loaded',
            data: {
                targetOrigin: window.location.origin,
            },
        });
        this.post({ type: 'submit.broadcast' });
    }

    private handleMessage = (event: MessageEvent) => {
        const { contentWindow } = this;
        if (
            this.errored ||
            this.stage === 'destroyed' ||
            !contentWindow ||
            event.origin !== this.targetOrigin ||
            event.source !== contentWindow
        ) {
            return;
        }

        const eventData = event.data;
        const eventDataType = eventData?.type;
        const eventDataPayload = eventData?.payload;

        if (eventDataType === 'init' && this.stage === 'initialize') {
            this.stage = 'initialized';
            this.addLog('Initialized', undefined, 'step');
            this.post({ type: 'load' });
        }

        if (eventDataType === 'onload' && this.stage === 'initialized') {
            clearTimeout(this.errorTimeoutHandle);
            this.stage = 'loaded';
            this.addLog('Fully loaded', undefined, 'step');
            this.flush();
            this.options.onSuccess?.();
            if (this.challengeResolve) {
                this.requestChallenge();
            }
        }

        if (eventDataType === 'onerror') {
            this.addLog('Script error', { error: eventDataPayload }, 'message');
        }

        if (eventDataType === 'child.message.data' && this.stage === 'loaded') {
            const messageData = eventData.data;
            const resolve = this.challengeResolve;
            if (!messageData || !resolve) {
                return;
            }
            this.clearChallengeRequest();
            resolve({
                [messageData.id]: messageData.fingerprint,
            });
        }
    };
}

export default ChallengeFrameController;
