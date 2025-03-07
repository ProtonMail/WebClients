import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import type { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import type { WorkerDecryptionResult } from 'packages/crypto/lib';

export interface DecryptedAttachment extends Omit<WorkerDecryptionResult<Uint8Array>, 'verificationStatus'> {
    verificationStatus: MAIL_VERIFICATION_STATUS
};

export type AttachmentsState = SimpleMap<DecryptedAttachment>;
