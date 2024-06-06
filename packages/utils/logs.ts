import { traceError } from '@proton/shared/lib/helpers/sentry';

type DebugLogDetail = {
    type: string;
    times: Date[];
};

// This is to be safe and to avoid [object Object] appearing, forces the consumer to make the necessary changes for compatibility
interface HasToString {
    toString: () => string;
}

type Args = (string | number | boolean | HasToString)[];
type LogTypes = 'error' | 'warn' | 'debug' | 'info';

const toString = (args: Args): string => {
    return args
        .map((arg: any) => {
            return arg.toString();
        })
        .join(' ');
};

const report = (tag: string, ...args: Args) => {
    const error = args.find((arg) => arg instanceof Error);
    traceError(error || new Error(toString(args)), {
        tags: {
            tag,
        },
        ...(error && {
            extra: {
                ...args.filter((arg) => arg instanceof Error),
            },
        }),
    });
};

/**
 * Interface for a logger system that supports different levels of logging.
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
}

export class Logger implements LoggerInterface {
    private identifier: string;

    private stack: [string, DebugLogDetail][] = [];

    constructor(identifier: string) {
        this.identifier = identifier;
        this.listenForKeyBoard();
    }

    public debug(...args: Args): void {
        console.log(...this.logWithColorParams(), ...args);
        this.save(toString(args), 'warn');
    }

    public info(...args: Args): void {
        console.log(...this.logWithColorParams(), ...args);
        this.save(toString(args), 'info');
    }

    public warn(...args: Args): void {
        console.warn(...args);
        this.save(toString(args), 'warn');
    }

    public error(...args: Args): void {
        console.error(...args);
        report(this.identifier, ...args);
        this.save(toString(args), 'error');
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
    }

    private logWithColorParams(): string[] {
        const date = new Date();
        const timeString = `${date.toLocaleTimeString().replace(' PM', '').replace(' AM', '')}.${date.getMilliseconds()}`;
        return [`%c${this.identifier}%c${timeString}`, 'color: font-weight: bold; margin-right: 4px', 'color: gray'];
    }

    private listenForKeyBoard(): void {
        const isMainFrame = window.top === window.self;
        window.addEventListener('keydown', (event) => {
            // Mac/Windows/Linux: Press Ctrl + Shift + H (uppercase)
            if (event.ctrlKey && event.shiftKey && event.key === 'H') {
                // Download logs from current frame
                this.downloadLogs();

                // If we're in a child frame, we postMessage to the parent
                if (!isMainFrame) {
                    window.parent.postMessage({ type: 'downloadLogs' }, '*');
                }
            }
        });

        // For main frame, we listen to child frames padding over the keyboard event
        if (isMainFrame) {
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'downloadLogs') {
                    this.downloadLogs();
                }
            });
        }
    }
}
