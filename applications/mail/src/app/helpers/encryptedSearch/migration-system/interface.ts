import type { openESDB } from '@proton/encrypted-search/esIDB';
import type { ESCiphertext, ESTimepoint } from '@proton/encrypted-search/models';
import type { UserModel } from '@proton/shared/lib/interfaces';

import type { ESBaseMessage, ESMessageContent } from 'proton-mail/models/encryptedSearch';

export type MigrationToolParams = { user: UserModel; keyPassword: string };

export type MigrationToolAPI = {
    migration: (params: MigrationToolParams) => Promise<void>;
};

export type EncryptedSearchData = {
    metadata: ESBaseMessage | undefined;
    content: ESMessageContent | undefined;
    timepoint: ESTimepoint | undefined;
};

export type DBType = NonNullable<Awaited<ReturnType<typeof openESDB>>>;

export type ESItemCursorResult = { key: string; value: ESCiphertext };

export const CONTENT_EXTRACTION_MAX_RETRIES = 5;
