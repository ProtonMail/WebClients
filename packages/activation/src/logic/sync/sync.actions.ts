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
import { AuthenticationMethod, EASY_SWITCH_FEATURES, ImportType } from '@proton/activation/src/interface';
import { formatApiSync } from '@proton/activation/src/logic/sync/sync.helpers';
import type { CreateNotificationOptions } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { getEasySwitchFeaturesFromProducts } from '../../hooks/useOAuthPopup.helpers';
import type { EasySwitchThunkExtra } from '../store';
import type { LoadingState, Sync } from './sync.interface';

type SubmitError = { Code: number; Error: string };

export enum SyncTokenStrategy {
    create,
    useExisting,
}

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

export interface CreateSyncExistingToken {
    type: SyncTokenStrategy.useExisting;
    token: ImportToken;
}

export interface CreateSyncNeedsToken {
    type: SyncTokenStrategy.create;
    Code: string;
    Provider: OAUTH_PROVIDER;
    RedirectUri: string;
}

export type CreateSyncProps = (CreateSyncNeedsToken | CreateSyncExistingToken) & {
    type: SyncTokenStrategy,
    successNotification?: CreateNotificationOptions;
    errorNotification?: CreateNotificationOptions;
    expectedEmailAddress?: { address: string; type: 'reconnect' | 'convertToBYOE' };
    Source: EASY_SWITCH_SOURCES;
}

export const createSyncItem = createAsyncThunk<
    any,
    CreateSyncProps,
    EasySwitchThunkExtra & {
        rejectValue: SubmitError;
        fulfillValue: Sync;
    }
>('sync/create', async (props, thunkApi) => {
    const { type, Source, successNotification, errorNotification, expectedEmailAddress } = props;

    try {
        let token: ImportToken;

        if (type === SyncTokenStrategy.create) {
            const { Code, Provider, RedirectUri } = props;

            const { Token }: { Token: ImportToken; DisplayName: string } = await thunkApi.extra.api(
                createToken({
                    Provider,
                    Code,
                    RedirectUri,
                    Source,
                    Features: getEasySwitchFeaturesFromProducts([ImportType.MAIL]),
                    Account: expectedEmailAddress?.address,
                })
            );

            token = Token;
        } else {
            const {token: inputToken} = props
            token = inputToken;
        }

        const { Features, ID, Account } = token;

        // When reconnecting the BYOE address, the user can choose a different gmail account that the BYOE he's trying to reconnect.
        // We need to make sure they are matching to continue
        if (expectedEmailAddress && Account !== expectedEmailAddress.address) {
            if (expectedEmailAddress.type === 'reconnect') {
                throw new Error(c('error').t`Please sign in with the same Gmail address you originally connected`);
            } else {
                throw new Error(
                    c('error').t`Please sign in with a Gmail address that already forwards to ${MAIL_APP_NAME}`
                );
            }
        }

        const createImportPayload: CreateImportPayload = {
            TokenID: ID,
            Source,
        };

        if (Features.includes(EASY_SWITCH_FEATURES.IMPORT_MAIL)) {
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
            const { Sync } = await thunkApi.extra.api(createSync(ImporterID, Source));
            await thunkApi.extra.eventManager.call();
            sync = formatApiSync(Sync);
        }

        if (successNotification) {
            thunkApi.extra.notificationManager.createNotification(successNotification);
        }
        return thunkApi.fulfillWithValue({ sync });
    } catch (error: any) {
        if (errorNotification) {
            thunkApi.extra.notificationManager.createNotification(errorNotification);
        }
        return thunkApi.rejectWithValue(error.data as SubmitError);
    }
});

export interface ResumeSyncExistingToken {
    type: SyncTokenStrategy.useExisting;
    token: ImportToken;
}

export interface ResumeSyncNeedsToken {
    type: SyncTokenStrategy.create;
    Code: string;
    Provider: OAUTH_PROVIDER;
    RedirectUri: string;
    Source: EASY_SWITCH_SOURCES;
}

export type ResumeSyncProps = (ResumeSyncNeedsToken | ResumeSyncExistingToken) & {
    type: SyncTokenStrategy,
    syncId: string;
    importerId: string;
    successNotification?: CreateNotificationOptions;
    errorNotification?: CreateNotificationOptions;
    expectedEmailAddress?: { address: string; type: 'reconnect' | 'convertToBYOE' };
}

export const resumeSyncItem = createAsyncThunk<
    any,
    ResumeSyncProps,
    EasySwitchThunkExtra & {
        rejectValue: SubmitError;
    }
>('sync/resume', async (props, thunkApi) => {
    try {
        const { type, successNotification, syncId, importerId } = props;
        let token: ImportToken;

        if (type === SyncTokenStrategy.create) {
            const { Code, Provider, RedirectUri, Source } = props;

            const { Token }: { Token: ImportToken } = await thunkApi.extra.api(
                createToken({
                    Provider,
                    Code,
                    RedirectUri,
                    Source,
                    Features: getEasySwitchFeaturesFromProducts([ImportType.MAIL]),
                })
            );

            token = Token;
        }else {
            const {token: inputToken} = props
            token = inputToken
        }

        await thunkApi.extra.api(updateImport(importerId, { TokenID: token.ID }));
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
