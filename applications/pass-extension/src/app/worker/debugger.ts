/** Debug interceptors for MV3 service workers, where DevTools access is limited.
 * Captures and forwards errors, console logs, and network failures to the local
 * HTTP debug server. To launch the debug server, run `yarn debugger:http` */
import { registerLoggerEffect } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

const ORIGINAL_FETCH = self.fetch;

export const sendDebugLog = HTTP_DEBUGGER
    ? (type: 'log' | 'info' | 'warn' | 'error' | 'debug', message: string) => {
          void ORIGINAL_FETCH(
              `http://localhost:${HTTP_DEBUGGER_PORT}/log?message=${encodeURIComponent(
                  JSON.stringify({
                      date: Date.now(),
                      type,
                      message,
                  })
              )}`
          );
      }
    : noop;

if (HTTP_DEBUGGER) {
    const ORIGINAL_CONSOLE = { ...console };
    const ORIGINAL_ON_ERROR = self.onerror;
    const ORIGINAL_ON_UNHANDLED_REJECTION = self.onunhandledrejection;

    self.onerror = (message, source, lineno, colno, error) => {
        sendDebugLog('error', `Uncaught Error: ${error?.stack || message}\nAt: ${source}:${lineno}:${colno}`);
        ORIGINAL_ON_ERROR?.call(self, message, source, lineno, colno, error);
        return false;
    };

    self.onunhandledrejection = (event) => {
        const error = event.reason;
        sendDebugLog('error', `Unhandled Rejection: ${error?.stack || error}`);
        ORIGINAL_ON_UNHANDLED_REJECTION?.call(self, event);
    };

    /** Capture network failures */
    self.fetch = async (input: RequestInfo | URL, init?: RequestInit) =>
        ORIGINAL_FETCH(input, init).catch((error) => {
            sendDebugLog(
                'error',
                /* eslint-disable-next-line no-nested-ternary */
                `Fetch failed ${init?.method || 'GET'} ${typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url} - ${
                    error instanceof Error ? `${error.name}: ${error.message}` : String(error)
                }`
            );

            throw error;
        });

    /** Intercept console methods */
    (['log', 'info', 'warn', 'error'] as const).forEach((method) => {
        self.console[method] = (...args) => {
            sendDebugLog(
                method,
                args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')
            );
            ORIGINAL_CONSOLE[method].apply(console, args);
        };
    });

    /** Loggers will noop to console in production,
     * forward any logger call to the debug server */
    if (ENV !== 'development') registerLoggerEffect((...args) => sendDebugLog('info', args.map(String).join(' ')));
}
