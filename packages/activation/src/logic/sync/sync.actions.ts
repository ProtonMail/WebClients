import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { c } from 'ttag';

import {
    createImport,
    createSync,
    createToken,
    deleteSync,
    getSyncList,
    resumeSync,
    updateImport,
} from '@proton/activation/src/api';
import type { APIImportSyncListResponse } from '@proton/activation/src/api/api.interface';
import type {
    CreateImportPayload,
    EASY_SWITCH_SOURCES,
    ImportToken,
    OAUTH_PROVIDER,
} from '@proton/activation/src/interface';
import { AuthenticationMethod, ImportType } from '@proton/activation/src/interface';
import { formatApiSync } from '@proton/activation/src/logic/sync/sync.helpers';
import type { CreateNotificationOptions } from '@proton/components';

import type { EasySwitchThunkExtra } from '../store';
import type { LoadingState, Sync } from './sync.interface';

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
    { syncId: string; showNotification?: boolean },
    EasySwitchThunkExtra & { rejectedValue: SubmitError }
>('sync/delete', async ({ syncId, showNotification = true }, thunkApi) => {
    try {
        await thunkApi.extra.api(deleteSync(syncId));
        await thunkApi.extra.eventManager.call();

        if (showNotification) {
            thunkApi.extra.notificationManager.createNotification({
                text: c('account').t`Mail forward stopped`,
            });
        }

        return syncId;
    } catch (error: any) {
        return thunkApi.rejectWithValue(error.data as SubmitError);
    }
});

interface CreateSyncProps {
    Code: string;
    Provider: OAUTH_PROVIDER;
    RedirectUri: string;
    Source: EASY_SWITCH_SOURCES;
    successNotification?: CreateNotificationOptions;
    errorNotification?: CreateNotificationOptions;
    reconnectEmailAddress?: string;
}

export const createSyncItem = createAsyncThunk<
    any,
    CreateSyncProps,
    EasySwitchThunkExtra & {
        rejectValue: SubmitError;
        fulfillValue: Sync;
    }
>('sync/create', async (props, thunkApi) => {
    const { Code, Provider, RedirectUri, Source, successNotification, errorNotification, reconnectEmailAddress } =
        props;

    try {
        const { Token, DisplayName }: { Token: ImportToken; DisplayName: string } = await thunkApi.extra.api(
            createToken({
                Provider,
                Code,
                RedirectUri,
                Source,
                Products: [ImportType.MAIL],
                Account: reconnectEmailAddress,
            })
        );

        const { Products, ID, Account } = Token;

        // When reconnecting the BYOE address, the user can chose a different gmail account that the BYOE he's trying to reconnect.
        // We need to make sure they are matching to continue
        if (reconnectEmailAddress && Account !== reconnectEmailAddress) {
            throw new Error(c('error').t`Please sign in with the same Gmail address you originally connected`);
        }

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

        const allSync = Object.values(thunkApi.getState().sync.syncs);
        let sync = allSync.find((sync) => sync.account === Account);

        // If a sync already exists for an address, we should not create a new sync, otherwise we will get an error
        if (!sync) {
            const { Sync } = await thunkApi.extra.api(createSync(ImporterID));
            await thunkApi.extra.eventManager.call();
            sync = formatApiSync(Sync);
        }

        if (successNotification) {
            thunkApi.extra.notificationManager.createNotification(successNotification);
        }
        return thunkApi.fulfillWithValue({ sync, displayName: DisplayName });
    } catch (error: any) {
        if (errorNotification) {
            thunkApi.extra.notificationManager.createNotification(errorNotification);
        }
        return thunkApi.rejectWithValue(error.data as SubmitError);
    }
});

interface ResumeSyncProps extends CreateSyncProps {
    syncId: string;
    importerId: string;
}

export const resumeSyncItem = createAsyncThunk<
    any,
    ResumeSyncProps,
    EasySwitchThunkExtra & {
        rejectValue: SubmitError;
    }
>('sync/resume', async (props, thunkApi) => {
    try {
        const { Code, Provider, RedirectUri, Source, successNotification, syncId, importerId } = props;

        const { Token }: { Token: ImportToken } = await thunkApi.extra.api(
            createToken({
                Provider,
                Code,
                RedirectUri,
                Source,
                Products: [ImportType.MAIL],
            })
        );

        await thunkApi.extra.api(updateImport(importerId, { TokenID: Token.ID }));
        await thunkApi.extra.api(resumeSync(syncId));
        await thunkApi.extra.eventManager.call();

        if (successNotification) {
            thunkApi.extra.notificationManager.createNotification(successNotification);
        }
        return;
    } catch (error: any) {
        return thunkApi.rejectWithValue(error.data as SubmitError);
    }
});
