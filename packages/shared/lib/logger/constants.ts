import { DAY } from '@proton/shared/lib/constants';

import type { LogLevel } from './types';

/** Prefix for every logger IndexedDB database. */
export const LOGGER_DB_PREFIX = 'proton-logger-';

export const DEFAULT_LOGGER_NAME = 'default';
export const DEFAULT_MAX_ENTRIES = 10_000;
export const DEFAULT_RETENTION_DAYS = 7;
export const DEFAULT_CONSOLE_LEVELS: LogLevel[] = ['error'];

/** Lines buffered before `initialize()` resolves. Oldest are dropped past this. */
export const MAX_PENDING_LOGS = 1_000;

export const CLEANUP_INTERVAL_MS = DAY;
