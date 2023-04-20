import { call, put, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';
import uniqid from 'uniqid';

import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import { ItemRevision, ItemRevisionContentsResponse, Maybe } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { logger } from '@proton/pass/utils/logger';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import chunk from '@proton/utils/chunk';

import {
    acknowledgeRequest,
    importItemsFailure,
    importItemsIntent,
    importItemsSuccess,
    itemsBatchImported,
    notification,
    vaultCreationIntent,
    vaultCreationSuccess,
} from '../actions';
import { WorkerRootSagaOptions } from '../types';
import { importItemsBatch, parseItemRevision } from './workers/items';

/**
 * When creating vaults from the import saga
 * we want to internally trigger any saga that
 * may result from vaultCreationSuccess (notably
 * the event-loop channel updates) : leverage
 * the withCallback vaultCreationIntent to await
 * the vault creation result
 */
function* createVaultForImport(vaultName: string) {
    const date = new Date().toLocaleDateString();
    let resolver: (shareId: Maybe<string>) => void;
    const creationResult = new Promise<Maybe<string>>((res) => (resolver = res));

    yield put(
        vaultCreationIntent(
            { id: uniqid(), content: { name: vaultName, description: c('Info').t`Imported on ${date}`, display: {} } },
            (action) => (vaultCreationSuccess.match(action) ? resolver(action.payload.share.shareId) : undefined)
        )
    );

    const shareId: Maybe<string> = yield creationResult;

    if (shareId === undefined) {
        throw new Error(c('Warning').t`Could not create vault "${vaultName}"`);
    }

    return shareId;
}

function* importWorker(
    { onItemsChange, telemetry }: WorkerRootSagaOptions,
    { payload: { data, provider }, meta }: ReturnType<typeof importItemsIntent>
) {
    let totalItems: number = 0;
    const totalVaults = new Set(data.map((vault) => (vault.type === 'existing' ? vault.shareId : vault.id))).size;

    try {
        /**
         * we want to apply these request sequentially to avoid
         * swarming the network with too many parallel requests
         */
        for (const vaultData of data) {
            try {
                const shareId: string =
                    vaultData.type === 'existing'
                        ? vaultData.shareId
                        : yield call(createVaultForImport, vaultData.vaultName);

                for (const batch of chunk(vaultData.items, 50)) {
                    try {
                        const revisions: ItemRevisionContentsResponse[] = yield importItemsBatch(shareId, batch);
                        const items: ItemRevision[] = yield Promise.all(
                            revisions.map((revision) => parseItemRevision(shareId, revision))
                        );

                        totalItems += revisions.length;

                        yield put(itemsBatchImported({ shareId, items }));
                    } catch (e) {
                        const description = e instanceof Error ? getApiErrorMessage(e) ?? e?.message : '';

                        yield put(
                            notification({
                                target: meta.receiver,
                                type: 'error',
                                text: c('Error').t`Import failed for vault "${vaultData.vaultName}" : ${description}`,
                            })
                        );
                    }
                }
            } catch (e) {
                logger.warn('[Saga::Import]', e);
                yield put(
                    notification({
                        target: meta.receiver,
                        type: 'error',
                        text: c('Error').t`Vault "${vaultData.vaultName}" could not be created`,
                    })
                );
            }
        }

        telemetry?.(
            createTelemetryEvent(
                TelemetryEventName.ImportCompletion,
                { item_count: totalItems, vaults: totalVaults },
                { source: provider }
            )
        );

        yield put(importItemsSuccess({ total: totalItems }, meta.receiver));
        onItemsChange?.();
    } catch (error: any) {
        yield put(importItemsFailure(error, meta.receiver));
    } finally {
        yield put(acknowledgeRequest(meta.request.id));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(importItemsIntent.match, importWorker, options);
}
