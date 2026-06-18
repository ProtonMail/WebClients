import type { WorkerDecryptionResult } from '@protontech/crypto';

import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import type { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

export interface DecryptedAttachment extends Omit<
    WorkerDecryptionResult<Uint8Array<ArrayBuffer>>,
    'verificationStatus'
> {
    verificationStatus: MAIL_VERIFICATION_STATUS;

    /**
     * Embedded image identifiers, kept so a deleted inline image can be looked up
     * by its CID/CLOC and re-uploaded (preserving the same CID) when restored via undo.
     */
    cid?: string;
    cloc?: string;
    /** MIME type, needed to rebuild a File from the stored bytes on re-upload. */
    type?: string;
}

export type AttachmentsState = SimpleMap<DecryptedAttachment>;
