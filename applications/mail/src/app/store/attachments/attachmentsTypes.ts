import type { DecryptedAttachment } from '@proton/mail-message/store/attachments/attachmentsTypes';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';

export type { DecryptedAttachment };

export type AttachmentsState = SimpleMap<DecryptedAttachment>;
