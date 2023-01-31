import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { createImport, createSync, createToken, deleteSync, getSyncList } from '@proton/activation/api';
import { APIImportSyncListResponse } from '@proton/activation/api/api.interface';
import {
    AuthenticationMethod,
    CreateImportPayload,
    EASY_SWITCH_SOURCE,
    ImportToken,
    ImportType,
    OAUTH_PROVIDER,
} from '@proton/activation/interface';
import { CreateNotificationOptions } from '@proton/components';

import { EasySwitchThunkExtra } from '../store';
import { LoadingState } from './sync.interface';

type SubmitError = { Code: number; Error: string };

export const changeCreateLoadingState = createAction<LoadingState>('sync/changeCreateLoadingState');

export const loadSyncList = createAsyncThunk<
    APIImportSyncListResponse,
    undefined,
    EasySwitchThunkExtra & { rejectedValue: SubmitError }
>('sync/load', async (_, thunkApi) => {
    try {
        const activeSync = await thunkApi.extra.api<APIImportSyncListResponse>(getSyncList());
        return activeSync;
    } catch (error: any) {
        return thunkApi.rejectWithValue(error.data as SubmitError);
    }
});

export const deleteSyncItem = createAsyncThunk<
    string,
    { syncId: string },
    EasySwitchThunkExtra & { rejectedValue: SubmitError }
>('sync/delete', async ({ syncId }, thunkApi) => {
    try {
        await thunkApi.extra.api(deleteSync(syncId));
        await thunkApi.extra.eventManager.call();
        thunkApi.extra.notificationManager.createNotification({
            text: c('loc_nightly:account').t`Synchronization stopped`,
        });

        return syncId;
    } catch (error: any) {
        return thunkApi.rejectWithValue(error.data as SubmitError);
    }
});

interface CreateSyncProps {
    Code: string;
    Provider: OAUTH_PROVIDER;
    RedirectUri: string;
    Source: EASY_SWITCH_SOURCE;
    notification: CreateNotificationOptions;
}

export const createSyncItem = createAsyncThunk<
    any,
    CreateSyncProps,
    EasySwitchThunkExtra & {
        rejectValue: SubmitError;
    }
>('sync/create', async (props, thunkApi) => {
    try {
        const { Code, Provider, RedirectUri, Source, notification } = props;

        const { Token }: { Token: ImportToken } = await thunkApi.extra.api(
            createToken({
                Provider,
                Code,
                RedirectUri,
                Source,
                Products: [ImportType.MAIL],
            })
        );

        const { Products, ID, Account } = Token;

        const createImportPayload: CreateImportPayload = {
            TokenID: ID,
            Source,
        };

        if (Products.includes(ImportType.MAIL)) {
            createImportPayload[ImportType.MAIL] = {
                Account,
                Sasl: AuthenticationMethod.OAUTH,
            };
        }

        const { ImporterID } = await thunkApi.extra.api(createImport(createImportPayload));
        await thunkApi.extra.api(createSync(ImporterID));
        await thunkApi.extra.eventManager.call();
        thunkApi.extra.notificationManager.createNotification(notification);
        return;
    } catch (error: any) {
        return thunkApi.rejectWithValue(error.data as SubmitError);
    }
});
