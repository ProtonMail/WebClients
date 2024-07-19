import type { WorkerDecryptionResult } from '@proton/crypto';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';

export type AttachmentsState = SimpleMap<WorkerDecryptionResult<Uint8Array>>;
