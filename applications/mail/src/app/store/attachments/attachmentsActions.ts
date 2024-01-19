import { createAction } from '@reduxjs/toolkit';

import { WorkerDecryptionResult } from '@proton/crypto';

export const addAttachment = createAction<{ ID: string; attachment: WorkerDecryptionResult<Uint8Array> }>(
    'attachments/add'
);

export const updateAttachment = createAction<{ ID: string; attachment: WorkerDecryptionResult<Uint8Array> }>(
    'attachments/update'
);
