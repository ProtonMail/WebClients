import { WorkerDecryptionResult } from '@proton/crypto';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';

export type AttachmentsState = SimpleMap<WorkerDecryptionResult<Uint8Array>>;
