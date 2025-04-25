// The sentry logger instance is provided by the user of the package;
// we do not want to bundle it with the package itself.
import type { captureMessage as sentryCaptureMessage } from '@sentry/browser';

export type SentryLogger = (...args: Parameters<typeof sentryCaptureMessage>) => string | void;
