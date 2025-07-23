import { DAY } from '@proton/shared/lib/constants';

/**
 * Constants used across the logger module
 */

/**
 * Prefix used for all logger-related storage (IndexedDB databases and LocalStorage keys)
 */
export const LOGGER_DB_PREFIX = 'proton-logger-';

/**
 * Default configuration values
 */
export const DEFAULT_MAX_ENTRIES = 10000;
export const DEFAULT_RETENTION_DAYS = 7;
export const DEFAULT_LOGGER_NAME = 'default';

/**
 * Pending logs management
 */
export const MAX_PENDING_LOGS = 1000;
export const PENDING_LOGS_TRIM_SIZE = 500;

/**
 * Time intervals
 */
export const CLEANUP_INTERVAL_MS = DAY; // 24 hours
