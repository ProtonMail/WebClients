import { Logging } from '@proton/drive/modules/logging';

/**
 * The logging system for the Drive application.
 *
 * Use it to create a logger instance to log messages to the default log
 * handlers.
 *
 * ```typescript
 * const logger = logging.getLogger('my-module');
 * logger.info('Hello, world!');
 * ```
 */
export const logging = new Logging({
    sentryComponent: 'drive-web-log',
});
