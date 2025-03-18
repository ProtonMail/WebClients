import { call, put, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { MAX_MAX_BATCH_PER_REQUEST } from '@proton/pass/constants';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { type ImportVault } from '@proton/pass/lib/import/types';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { importItemsBatch } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import {
    fileLinkPending,
    importItemsFailure,
    importItemsIntent,
    importItemsProgress,
    importItemsSuccess,
    notification,
    startEventPolling,
    stopEventPolling,
    vaultCreationIntent,
} from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/enhancers/endpoint';
import { createVaultWorker } from '@proton/pass/store/sagas/vaults/vault-creation.saga';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemImportIntent, ItemRevision, ItemRevisionContentsResponse, Maybe } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import capitalize from '@proton/utils/capitalize';
import chunk from '@proton/utils/chunk';

/** Creates a vault specifically for import purposes by directly invoking
 * the vault creation worker saga. This bypasses the usual action dispatch
 * flow and allows us to await the vault creation result synchronously
 * within the import saga. Returns the generated shareId. */
function* createVaultForImport(vaultName: string) {
    const date = new Date().toLocaleDateString();

    const shareId: Maybe<string> = yield call(
        createVaultWorker,
        vaultCreationIntent({
            content: {
                name: vaultName,
                description: c('Info').t`Imported on ${date}`,
                display: {},
            },
        })
    );

    if (shareId === undefined) throw new Error(c('Warning').t`Could not create vault "${vaultName}"`);
    return shareId;
}

function* uploadFiles(importIntent: ItemImportIntent[], items: ItemRevision[]) {
    for (let index = 0; index < importIntent.length; index++) {
        const files = importIntent[index].files;
        if (!files?.length) continue;

        const { shareId, itemId, revision } = items[index];

        // If an item has more than 10 files to import, we need to split the linking into chunks of 10 files
        for (const toAdd of chunk(files as string[], 10)) {
            yield put(
                fileLinkPending.intent({
                    shareId,
                    itemId,
                    revision,
                    files: filesFormInitializer({ toAdd }),
                })
            );
        }
    }
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

                for (const batch of chunk(vaultData.items, MAX_MAX_BATCH_PER_REQUEST)) {
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

                        yield uploadFiles(batch, items);

                        totalItems += revisions.length;
                        yield put(importItemsProgress(meta.request.id, totalItems, { shareId, items }));
                    } catch (e) {
                        const description = e instanceof Error ? (getApiErrorMessage(e) ?? e?.message) : '';
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

        void telemetry?.push(
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
