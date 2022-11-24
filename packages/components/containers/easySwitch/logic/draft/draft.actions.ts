import { createAction } from '@reduxjs/toolkit';

import { ImportAuthType, ImportProvider, ImportType } from '../types/shared.types';

export const resetDraft = createAction('draft/reset');

export const startDraft = createAction<{
    provider: ImportProvider;
    authType: ImportAuthType;
    importType?: ImportType | ImportType[];
}>('draft/start');

export const selectProductToImport = createAction<{ importType: ImportType | ImportType[] }>('draft/selectProduct');

export const readInstructions = createAction<boolean>('draft/readInstructions');
