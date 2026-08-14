import type { LogLevel } from './types';

export const DAY = 24 * 60 * 60 * 1000;

/** Prefix for every logger IndexedDB database. */
export const LOGGER_DB_PREFIX = 'proton-logs-';

/**
 * Prefix used by the alpha logger, for both IndexedDB databases and localStorage keys.
 *
 * Nothing reads it any more: the alpha stored one ciphertext per log argument, which this
 * schema cannot decode. Those databases will be deleted rather than migrated.
 */
export const LEGACY_LOGGER_DB_PREFIX = 'proton-logger-';

export const DEFAULT_LOGGER_NAME = 'default';
export const DEFAULT_MAX_ENTRIES = 10_000;
export const DEFAULT_RETENTION_DAYS = 7;
export const DEFAULT_CONSOLE_LEVELS: LogLevel[] = ['error'];
export const ALL_CONSOLE_LEVELS: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];

/** Lines buffered before `initialize()` resolves. Oldest are dropped past this. */
export const MAX_PENDING_LOGS = 1_000;

export const CLEANUP_INTERVAL_MS = DAY;
