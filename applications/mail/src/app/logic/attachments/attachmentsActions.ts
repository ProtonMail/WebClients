import { createAction } from '@reduxjs/toolkit';
import { DecryptResultPmcrypto } from 'pmcrypto';

export const addAttachment = createAction<{ ID: string; attachment: DecryptResultPmcrypto }>('attachments/add');

export const updateAttachment = createAction<{ ID: string; attachment: DecryptResultPmcrypto }>('attachments/update');
