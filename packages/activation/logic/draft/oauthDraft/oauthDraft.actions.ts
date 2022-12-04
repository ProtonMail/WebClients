import { createAction } from '@reduxjs/toolkit';

import { MailImportFields } from '@proton/activation/components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.interface';
import { ImportType } from '@proton/activation/interface';
import { ImportProvider } from '@proton/activation/interface';

import { ImporterCalendar, MailImportState } from './oauthDraft.interface';

export const OAUTH_ACTION_PREFIX = 'draft/oauth';

export const resetOauthDraft = createAction(`${OAUTH_ACTION_PREFIX}/reset`);

export const startOauthDraft = createAction<{
    provider: ImportProvider;
    products: ImportType[];
}>(`${OAUTH_ACTION_PREFIX}/start`);

export const initOauthMailImport = createAction(`${OAUTH_ACTION_PREFIX}/initOauthImport`);

export const displayConfirmLeaveModal = createAction<boolean>(`${OAUTH_ACTION_PREFIX}/displayConfirmLeaveModal`);

export const submitProductProvider = createAction<{ products: ImportType[]; scopes: string[] }>(
    `${OAUTH_ACTION_PREFIX}/submitProductProvider`
);

export const submitProducts = createAction<ImportType[]>(`${OAUTH_ACTION_PREFIX}/submitProducts`);

export const changeOAuthStep = createAction<MailImportState['step']>(`${OAUTH_ACTION_PREFIX}/changeOAuthStep`);

export const updateCalendarData = createAction<ImporterCalendar[]>(`${OAUTH_ACTION_PREFIX}/updateCalendarData`);
export const updateEmailsData = createAction<MailImportFields>(`${OAUTH_ACTION_PREFIX}/updateEmailsData`);
