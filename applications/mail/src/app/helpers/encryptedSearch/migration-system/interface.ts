import type { ESCiphertext } from '@proton/encrypted-search/models';
import type { UserModel } from '@proton/shared/lib/interfaces';

import type { ESMessageContent } from 'proton-mail/models/encryptedSearch';

import type { CONTENT_VERSION } from '../esBuild';

export type MigrationToolParams = { user: UserModel; keyPassword: string };

export type CleanTextFn = (text: string, includeQuote: boolean) => Promise<string>;

export type MigrationToolAPI = {
    migration: (params: MigrationToolParams, cleanText: CleanTextFn) => Promise<void>;
};

export type ESItemCursorResult = { key: string; value: ESCiphertext };

export type MigrateFn = (data: ESMessageContent) => Promise<ESMessageContent>;

export type MigrationMethod = { targetVersion: CONTENT_VERSION; fn: MigrateFn };

export type PreparedMessageContent = { original: ESCiphertext; updated: ESMessageContent | undefined; itemID: string };

export const CONTENT_EXTRACTION_MAX_RETRIES = 5;

export const READ_BATCH_SIZE = 100;
