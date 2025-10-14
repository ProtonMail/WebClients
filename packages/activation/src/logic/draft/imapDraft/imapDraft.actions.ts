import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { createImport, getImport, getMailImportData, resumeImport, startImportTask } from '@proton/activation/src/api';
import type {
    ApiCreateImporterResponse,
    ApiImportResponse,
    ApiImporterImportResponse,
    ApiStartImportParams,
    ApiStartImportResponse,
} from '@proton/activation/src/api/api.interface';
import type { MailImportFields } from '@proton/activation/src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.interface';
import { IMAPS } from '@proton/activation/src/constants';
import type { MailImportFolder } from '@proton/activation/src/helpers/MailImportFoldersParser/MailImportFoldersParser';
import MailImportFoldersParser from '@proton/activation/src/helpers/MailImportFoldersParser/MailImportFoldersParser';
import { AuthenticationMethod, ImportType, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import type { ImportProvider } from '@proton/activation/src/interface';
import type { ApiResponse } from '@proton/shared/lib/interfaces';

import { getEasySwitchFeaturesFromProducts } from '../../../hooks/useOAuthPopup.helpers';
import type { EasySwitchThunkExtra } from '../../store';
import type { MailImportState } from './imapDraft.interface';

const ACTION_PREFIX = 'draft/imap';

export const resetImapDraft = createAction(`${ACTION_PREFIX}/reset`);

export const startImapDraft = createAction<{ provider: ImportProvider }>(`${ACTION_PREFIX}/start`);

export const selectImapProduct = createAction<{ product: ImportType }>(`${ACTION_PREFIX}/selectProduct`);

export const readImapInstructions = createAction(`${ACTION_PREFIX}/readInstructions`);

export const initImapMailImport = createAction(`${ACTION_PREFIX}/initMailImport`);

type ImportFormValues = Required<Pick<MailImportState, 'domain' | 'email' | 'password' | 'port'>>;
type Response = {
    importerID: string;
    sasl: AuthenticationMethod;
    foldersMapping: MailImportFolder[];
} & ImportFormValues;
type SubmitError = { Code: number; Error: string };

export const submitImapMailCredentials = createAsyncThunk<
    Response,
    ImportFormValues & { allowSelfSigned: boolean },
    EasySwitchThunkExtra & {
        rejectValue: SubmitError;
    }
>(`${ACTION_PREFIX}/submitCredentials`, async (formValues, thunkApi) => {
    try {
        const sasl = AuthenticationMethod.PLAIN;
        const { email, domain, port, password, allowSelfSigned } = formValues;
        const { ImporterID } = await thunkApi.extra.api<ApiCreateImporterResponse>({
            ...createImport({
                [ImportType.MAIL]: {
                    Account: email,
                    ImapHost: domain,
                    ImapPort: parseInt(port, 10),
                    Sasl: sasl,
                    Code: password,
                    AllowSelfSigned: allowSelfSigned ? 1 : 0,
                },
            }),
            /*
             * For this call we display a custom error message on top of the form
             * and want to prevent the growler display
             */
            silence: true,
        });
        const { Folders = [] } = await thunkApi.extra.api<ApiImporterImportResponse>(
            getMailImportData(ImporterID, { Code: formValues.password })
        );

        const isLabelMapping = domain === IMAPS[OAUTH_PROVIDER.GOOGLE];
        const result: Response = {
            importerID: ImporterID,
            domain,
            email,
            foldersMapping: new MailImportFoldersParser(Folders, isLabelMapping).folders,
            password,
            port,
            sasl,
        };

        return result;
    } catch (error: any) {
        return thunkApi.rejectWithValue(error.data as SubmitError);
    }
});

export const saveImapMailFields = createAction<MailImportFields>(`${ACTION_PREFIX}/saveFields`);

export const startImapMailImport = createAsyncThunk<ApiStartImportResponse, ApiStartImportParams, EasySwitchThunkExtra>(
    `${ACTION_PREFIX}/startImport`,
    async (params, thunkApi) => {
        const result = await thunkApi.extra.api(startImportTask(params));
        await thunkApi.extra.eventManager.call();
        return result;
    }
);

export const reconnectImapImport = createAsyncThunk<ApiImportResponse['Importer'], string, EasySwitchThunkExtra>(
    `${ACTION_PREFIX}/reconnect`,
    async (importID, thunkApi) => {
        const apiImporterResponse = await thunkApi.extra.api<ApiImportResponse>(getImport(importID));
        return apiImporterResponse.Importer;
    }
);

export const resumeImapImport = createAsyncThunk<
    void,
    {
        importID: string;
        product: ImportType;
    },
    EasySwitchThunkExtra
>(`${ACTION_PREFIX}/resumeImport`, async ({ importID, product }, thunkApi) => {
    await thunkApi.extra.api<ApiResponse>(
        resumeImport({
            ImporterID: importID,
            Features: getEasySwitchFeaturesFromProducts([product]),
        })
    );
    await thunkApi.extra.eventManager.call();
});

export const displayConfirmLeaveModal = createAction<boolean>(`${ACTION_PREFIX}/displayConfirmLeaveModal`);
