import { call, put, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { MAX_BATCH_ITEMS_PER_REQUEST } from '@proton/pass/constants';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import type { ItemRevision, ItemRevisionContentsResponse, Maybe } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import capitalize from '@proton/utils/capitalize';
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
import type { WithSenderAction } from '../actions/with-receiver';
import type { WorkerRootSagaOptions } from '../types';
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
            {
                id: uniqueId(),
                content: { name: vaultName, description: c('Info').t`Imported on ${date}`, display: {} },
            },
            (action) => resolver(vaultCreationSuccess.match(action) ? action.payload.share.shareId : undefined)
        )
    );

    const shareId: Maybe<string> = yield creationResult;
    if (shareId === undefined) throw new Error(c('Warning').t`Could not create vault "${vaultName}"`);

    return shareId;
}

function* importWorker(
    { onItemsChange, onImportProgress, telemetry }: WorkerRootSagaOptions,
    { payload: { data, provider }, meta }: WithSenderAction<ReturnType<typeof importItemsIntent>>
) {
    let totalItems: number = 0;
    const ignored: string[] = data.ignored;
    const vaultIds = data.vaults.map((vault) => (vault.type === 'existing' ? vault.shareId : vault.id));
    const totalVaults = new Set(vaultIds).size;

    try {
        /* we want to apply these request sequentially to avoid
         * swarming the network with too many parallel requests */
        for (const vaultData of data.vaults) {
            try {
                const shareId: string =
                    vaultData.type === 'existing'
                        ? vaultData.shareId
                        : yield call(createVaultForImport, vaultData.vaultName);

                for (const batch of chunk(vaultData.items, MAX_BATCH_ITEMS_PER_REQUEST)) {
                    try {
                        const revisions: ItemRevisionContentsResponse[] = yield importItemsBatch({
                            shareId,
                            importIntents: batch,
                            onSkippedItem: ({ type, metadata }) =>
                                ignored.push(`[${capitalize(type)}] ${metadata.name}`),
                        });

                        const items: ItemRevision[] = yield Promise.all(
                            revisions.map((revision) => parseItemRevision(shareId, revision))
                        );

                        totalItems += revisions.length;

                        onImportProgress?.(totalItems, meta.sender?.endpoint);
                        yield put(itemsBatchImported({ shareId, items }));
                    } catch (e) {
                        const description = e instanceof Error ? getApiErrorMessage(e) ?? e?.message : '';
                        ignored.push(...batch.map((item) => `[${capitalize(item.type)}] ${item.metadata.name}`));

                        yield put(
                            notification({
                                receiver: meta.sender?.endpoint,
                                key: meta.request.id,
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
                        key: meta.request.id,
                        receiver: meta.sender?.endpoint,
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

        yield put(
            importItemsSuccess(
                {
                    provider,
                    ignored,
                    total: totalItems,
                    importedAt: getEpoch(),
                    warnings: data.warnings,
                },
                meta.sender?.endpoint
            )
        );
        onItemsChange?.();
    } catch (error: any) {
        yield put(importItemsFailure(error, meta.sender?.endpoint));
    } finally {
        yield put(acknowledgeRequest(meta.request.id));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(importItemsIntent.match, importWorker, options);
}
