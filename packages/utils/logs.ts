/* eslint-disable no-console */
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { Availability, AvailabilityTypes } from './availability';

type DebugLogDetail = {
    type: string;
    times: Date[];
};

// This is to be safe and to avoid [object Object] appearing, forces the consumer to make the necessary changes for compatibility
interface HasToString {
    toString: () => string;
}

type Args = (string | number | boolean | HasToString | object | undefined | null)[];
type LogTypes = 'error' | 'warn' | 'debug' | 'info';

const toString = (args: Args): string => {
    return args
        .map((arg: any) => {
            if (typeof arg === 'object' && arg.toString() === '[object Object]') {
                return Object.keys(arg)
                    .map((key) => {
                        if (['string', 'number', 'boolean'].includes(typeof arg[key])) {
                            return `${key}:${arg[key]}`;
                        }
                    })
                    .join(' ');
            }
            return arg?.toString();
        })
        .join(' ');
};

const report = (tag: string, ...args: Args) => {
    const isMainFrame = !getIsIframe();

    if (isMainFrame) {
        const error = args.find((arg) => arg instanceof Error);
        traceError(error || new Error(toString(args)), {
            tags: {
                tag,
            },
            ...(error && {
                extra: {
                    ...args.filter((arg) => !(arg instanceof Error)),
                },
            }),
        });
    } else {
        // child frames bubble up the report to parent
        window.parent.postMessage({ type: '@proton/utils/logs:report', tag, args }, '*');
    }
};

/**
 * Interface for a logger system that supports different levels of logging.
 * The logger can work within iframes.
 * All logs are kept in memory and can be sent to customer support at the choice of the customer.
 * No private or sensitive information should be ever logged using any of these methods.
 * PII is what that ties back to the user. Eg: account information, keys, media metadata (filename, size, etc..), network setup, browser setup and so on.
 */
export interface LoggerInterface {
    /**
     * Logs debug-level messages, useful for development and troubleshooting.
     * @param args - The messages or objects to log. Do not include private or sensitive information.
     */
    debug(...args: Args): void;

    /**
     * Logs informational messages, typically used for general logging of application flow.
     * @param args - The messages or objects to log. Do not include private or sensitive information.
     */
    info(...args: Args): void;

    /**
     * Logs warning messages, indicating a potential issue or important situation to monitor.
     * @param args - The messages or objects to log. Do not include private or sensitive information.
     */
    warn(...args: Args): void;

    /**
     * Logs error messages, typically used for logging errors and exceptions.
     * @param args - The messages or objects to log. Do not include private or sensitive information.
     */
    error(...args: Args): void;

    /**
     * Initiates the download of the logged messages in memory.
     */
    downloadLogs(): void;

    /**
     * Clears all logged messages from the logger.
     */
    clearLogs(): void;

    setEnabled(enabled: boolean): void;
}

export class Logger implements LoggerInterface {
    private identifier: string;

    private stack: [string, DebugLogDetail][] = [];

    private verbose: boolean = false;

    private enabled: boolean = true;

    constructor(
        identifier: string,
        debugKey?: string,
        private limit = 10_000
    ) {
        this.identifier = identifier;
        this.verbose = typeof debugKey !== 'undefined' && localStorage.getItem(debugKey) === 'true';
        this.listen();
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    public debug(...args: Args): void {
        if (this.verbose) {
            console.log(...this.logWithColorParams(), ...args);
            this.save(toString(args), 'warn');
        }
    }

    public info(...args: Args): void {
        if (this.enabled) {
            console.log(...this.logWithColorParams(), ...args);
            this.save(toString(args), 'info');
        }
    }

    public warn(...args: Args): void {
        if (this.enabled) {
            console.warn(...args);
            this.save(toString(args), 'warn');
        }
    }

    public error(...args: Args): void {
        if (this.enabled) {
            console.error(...args);
            this.save(toString(args), 'error');
            report(this.identifier, ...args);
            Availability.mark(AvailabilityTypes.ERROR);
        }
    }

    public downloadLogs(): void {
        const logData = this.getLogs();
        if (!logData) {
            return;
        }

        const elm = document.createElement('a');
        elm.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logData));
        elm.setAttribute('download', `proton-${this.identifier}-debug.log`);
        elm.style.display = 'none';
        document.body.appendChild(elm);
        elm.click();
        document.body.removeChild(elm);
    }

    public clearLogs(): void {
        this.stack.splice(0, this.stack.length);
    }

    public getLogs(): string {
        let buffer = '';
        for (const [message, details] of this.stack) {
            buffer += `${JSON.stringify(Object.assign(details, { message }))}\n`;
        }
        return buffer;
    }

    private save(message: string, type: LogTypes, time = new Date()): void {
        const [lastMessage, lastDetails] = this.stack.at(this.stack.length - 1) || [];
        // To avoid logging a lot of the same message we log a timer if previous message is exactly the same
        if (lastMessage === message && lastDetails) {
            this.stack.splice(this.stack.length - 1, 1, [
                message,
                {
                    type,
                    times: [...lastDetails.times, time],
                },
            ]);
        } else {
            this.stack.push([
                message,
                {
                    type,
                    times: [time],
                },
            ]);
        }

        if (this.stack.length > this.limit) {
            this.stack.shift();
        }
    }

    private logWithColorParams(): string[] {
        const date = new Date();
        const timeString = `${date.toLocaleTimeString().replace(' PM', '').replace(' AM', '')}.${date.getMilliseconds()}`;
        return [`%c${this.identifier}%c${timeString}`, 'color: font-weight: bold; margin-right: 4px', 'color: gray'];
    }

    private listen(): void {
        const isMainFrame = !getIsIframe();

        window.addEventListener('keydown', (event) => {
            // Mac/Windows/Linux: Press Ctrl + Shift + H (uppercase)
            if (event.ctrlKey && event.shiftKey && event.key === 'H') {
                // Download logs from current frame
                this.downloadLogs();

                // If we're in a child frame, we postMessage to the parent
                if (!isMainFrame) {
                    window.parent.postMessage({ type: '@proton/utils/logs:downloadLogs' }, '*');
                }
            }
        });

        // For main frame, we listen to child frames padding over the keyboard event
        if (isMainFrame) {
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === '@proton/utils/logs:downloadLogs') {
                    this.downloadLogs();
                }
                if (event.data && event.data.type === '@proton/utils/logs:report') {
                    if (
                        typeof event.data.tag === 'string' &&
                        event.data.args &&
                        event.data.args != null &&
                        typeof event.data.args[Symbol.iterator] === 'function'
                    ) {
                        report(event.data.tag, ...event.data.args);
                    } else {
                        report(
                            this.identifier,
                            new Error('@proton/utils/logs:report message does not contain args or is not spreadable')
                        );
                    }
                }
            });
        }
    }
}
