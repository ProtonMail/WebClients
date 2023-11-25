import { call, put, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { MAX_BATCH_ITEMS_PER_REQUEST } from '@proton/pass/constants';
import { type ImportVault } from '@proton/pass/lib/import/types';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { importItemsBatch } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import {
    importItemsBatchSuccess,
    importItemsFailure,
    importItemsIntent,
    importItemsSuccess,
    notification,
    requestProgress,
    startEventPolling,
    stopEventPolling,
    vaultCreationIntent,
    vaultCreationSuccess,
} from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/with-receiver';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, ItemRevisionContentsResponse, Maybe } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import capitalize from '@proton/utils/capitalize';
import chunk from '@proton/utils/chunk';

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
            { content: { name: vaultName, description: c('Info').t`Imported on ${date}`, display: {} } },
            (action) => resolver(vaultCreationSuccess.match(action) ? action.payload.share.shareId : undefined)
        )
    );

    const shareId: Maybe<string> = yield creationResult;
    if (shareId === undefined) throw new Error(c('Warning').t`Could not create vault "${vaultName}"`);

    return shareId;
}

function* importWorker(
    { onItemsUpdated, getTelemetry }: RootSagaOptions,
    { payload: { data, provider }, meta }: WithSenderAction<ReturnType<typeof importItemsIntent>>
) {
    const telemetry = getTelemetry();
    yield put(stopEventPolling());

    let totalItems: number = 0;
    const ignored: string[] = data.ignored;

    const importVaults = groupByKey(data.vaults, 'shareId', { splitEmpty: true }).map(
        ([vault, ...vaults]): ImportVault => ({
            ...vault,
            items: vault.items.concat(...vaults.map(prop('items'))),
        })
    );

    try {
        /* we want to apply these request sequentially to avoid
         * swarming the network with too many parallel requests */
        for (const vaultData of importVaults) {
            try {
                const shareId: string = vaultData.shareId ?? (yield call(createVaultForImport, vaultData.name));

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

                        yield put(requestProgress(meta.request.id, totalItems));
                        yield put(importItemsBatchSuccess({ shareId, items }));
                    } catch (e) {
                        const description = e instanceof Error ? getApiErrorMessage(e) ?? e?.message : '';
                        ignored.push(...batch.map((item) => `[${capitalize(item.type)}] ${item.metadata.name}`));

                        yield put(
                            notification({
                                endpoint: meta.sender?.endpoint,
                                key: meta.request.id,
                                type: 'error',
                                text: c('Error').t`Import failed for vault "${vaultData.name}" : ${description}`,
                            })
                        );
                    }
                }
            } catch (e) {
                logger.warn('[Saga::Import]', e);
                yield put(
                    notification({
                        key: meta.request.id,
                        endpoint: meta.sender?.endpoint,
                        type: 'error',
                        text: c('Error').t`Vault "${vaultData.name}" could not be created`,
                    })
                );
            }
        }

        void telemetry?.pushEvent(
            createTelemetryEvent(
                TelemetryEventName.ImportCompletion,
                { item_count: totalItems, vaults: importVaults.length },
                { source: provider }
            )
        );

        yield put(
            importItemsSuccess(
                meta.request.id,
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
        onItemsUpdated?.();
    } catch (error: any) {
        yield put(importItemsFailure(meta.request.id, error, meta.sender?.endpoint));
    } finally {
        yield put(startEventPolling());
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(importItemsIntent.match, importWorker, options);
}
