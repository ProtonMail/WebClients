import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import type { PendingUpload } from 'proton-mail/hooks/composer/useAttachments/interface';

export enum AttachmentAction {
    Download,
    Preview,
    Remove,
    None,
}

export type AttachmentHandler =
    ((attachment: Attachment) => Promise<void>) | ((pendingUpload: PendingUpload) => Promise<void>);
