import { createAction } from '@reduxjs/toolkit';

import type { DecryptedAttachment } from './attachmentsTypes';

export const addAttachment = createAction<{ ID: string; attachment: DecryptedAttachment }>('attachments/add');

export const updateAttachment = createAction<{ ID: string; attachment: DecryptedAttachment }>('attachments/update');

export const addImageIdentifierAction = createAction<{ ID: string; cid: string | undefined; cloc: string | undefined }>(
    'attachments/add-image-identifier'
);
