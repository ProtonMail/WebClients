import type { ESCiphertext, ESTimepoint } from '@proton/encrypted-search/models';
import type { UserModel } from '@proton/shared/lib/interfaces';

import type { ESBaseMessage, ESMessageContent } from 'proton-mail/models/encryptedSearch';

export type MigrationToolParams = { user: UserModel; keyPassword: string };

export type CleanTextFn = (text: string, includeQuote: boolean) => string;

export type MigrationToolAPI = {
    migration: (params: MigrationToolParams, cleanText: CleanTextFn) => Promise<void>;
};

export type EncryptedSearchData = {
    metadata: ESBaseMessage | undefined;
    content: ESMessageContent | undefined;
    timepoint: ESTimepoint | undefined;
};

export type ESItemCursorResult = { key: string; value: ESCiphertext };

export type MigrateFn = (data: EncryptedSearchData) => EncryptedSearchData;

export const CONTENT_EXTRACTION_MAX_RETRIES = 5;

export const READ_BATCH_SIZE = 100;
