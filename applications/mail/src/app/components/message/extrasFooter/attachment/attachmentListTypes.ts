import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import type { PendingUpload } from '../../../../hooks/composer/useAttachments/interface';

export enum AttachmentAction {
    Download = 0,
    Preview = 1,
    Remove = 2,
    None = 3,
}

export type AttachmentHandler =
    ((attachment: Attachment) => Promise<void>) | ((pendingUpload: PendingUpload) => Promise<void>);
