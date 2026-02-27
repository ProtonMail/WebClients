import { logging } from '../../logging';

/**
 * Unified logger for the search module — works in both main thread and SharedWorker.
 *
 * Auto-detects its execution context via `SharedWorkerGlobalScope`. In the worker,
 * console output is not visible in the browser, so logs are forwarded to the main
 * thread over a BroadcastChannel. On the main thread, logs go directly to console.
 *
 * - `log(msg)`:   Console-only (forwarded to main thread when called from worker).
 * - `write(msg)`: Console + future persistent IndexedDB storage.
 *
 * Logging is gated behind the `proton-drive-debug` localStorage flag.
 * Call `Logger.listenForWorkerLogs()` once on the main thread to subscribe.
 */

const LOG_CHANNEL = 'search-module-logs';
const isWorker = typeof SharedWorkerGlobalScope !== 'undefined';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogPayload = { level: LogLevel; msg: string; error?: unknown };

const mainThreadLogger = logging.getLogger('search-module-main-thread');
const workerLogger = logging.getLogger('search-module-worker');

export class Logger {
    private static channel = new BroadcastChannel(LOG_CHANNEL);

    // Call once on the main thread to print forwarded worker logs to console.
    static listenForWorkerLogs() {
        if (isWorker) {
            return;
        }
        this.channel.onmessage = (e: MessageEvent<LogPayload>) => {
            if (e.data.level === 'error') {
                workerLogger.error(e.data.msg, e.data.error);
            } else {
                workerLogger[e.data.level](e.data.msg);
            }
        };
    }

    static debug(msg: string) {
        this.dispatch({ level: 'debug', msg });
    }

    static info(msg: string) {
        this.dispatch({ level: 'info', msg });
    }

    static warn(msg: string) {
        this.dispatch({ level: 'warn', msg });
    }

    static error(msg: string, error?: unknown) {
        this.dispatch({ level: 'error', msg, error });
    }

    private static dispatch(payload: LogPayload) {
        if (isWorker) {
            this.channel.postMessage(payload);
            return;
        }
        if (payload.level === 'error') {
            mainThreadLogger.error(payload.msg, payload.error);
        } else {
            mainThreadLogger[payload.level](payload.msg);
        }
    }
}
