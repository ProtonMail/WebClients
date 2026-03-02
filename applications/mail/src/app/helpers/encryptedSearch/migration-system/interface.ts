import type { openESDB } from '@proton/encrypted-search/esIDB';
import type { UserModel } from '@proton/shared/lib/interfaces';

import type { ESBaseMessage, ESMessageContent } from 'proton-mail/models/encryptedSearch';

export type MigrationToolParams = { user: UserModel; keyPassword: string };

export type EncryptedSearchData = { metadata: ESBaseMessage | undefined; content: ESMessageContent | undefined };

export type DBType = NonNullable<Awaited<ReturnType<typeof openESDB>>>;
