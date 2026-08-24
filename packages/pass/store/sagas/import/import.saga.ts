import type { Task } from 'redux-saga';
import { call, fork, put, select, take, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import chunk from '@proton/utils/chunk';

import { MAX_BATCH_PER_IMPORT_REQUEST } from '../../../constants';
import { type ImportReport, formatIgnoredItem } from '../../../lib/import/helpers/report';
import type { ImportVault } from '../../../lib/import/types';
import { importItemsBatch } from '../../../lib/items/item.requests';
import { createTelemetryEvent } from '../../../lib/telemetry/utils';
import { isAutofillModeDataOfTypeUrl, uniqueAutofillUrls } from '../../../lib/urls/utils/autofill';
import { isPaidPlan } from '../../../lib/user/user.predicates';
import type { IndexedByShareIdAndItemId, ItemImportIntent, ItemRevision, Maybe, MaybeNull, PassPlanResponse } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import type { UserPassPlan } from '../../../types/api/plan';
import { TelemetryEventName } from '../../../types/data/telemetry';
import { AutofillMode } from '../../../types/protobuf';
import { groupByKey } from '../../../utils/array/group-by-key';
import { getErrorMessage } from '../../../utils/errors/get-error-message';
import { prop } from '../../../utils/fp/lens';
import { logger } from '../../../utils/logger';
import { getEpoch } from '../../../utils/time/epoch';
import { importItems, importItemsProgress, notification, startEventPolling, stopEventPolling, vaultCreationIntent } from '../../actions';
import type { WithSenderAction } from '../../actions/enhancers/endpoint';
import { matchCancel } from '../../request/actions';
import { selectFeatureFlag, selectPassPlan, selectUserPlan } from '../../selectors';
import type { RootSagaOptions } from '../../types';
import { createVaultWorker } from '../vaults/vault-creation.saga';

type ImportWorkerState = {
    /** `true` when the import request has been cancelled via
     * `requestCancel` dispatch, but allows the current batch
     * operation to complete before terminating */
    aborted: boolean;
};

/** Creates a dedicated vault for imported items by directly invoking
 * the vault creation worker saga. This bypasses the standard action
 * dispatch flow, allowing us to synchronously obtain the vault's `shareId`
 * within the import saga workflow. */
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

/** Throws an AbortError if the import has been flagged as aborted */
const assertNotAborted = (state: ImportWorkerState) => {
    if (state.aborted) throw new DOMException('Import aborted', 'AbortError');
};

function* importWorker(
    state: ImportWorkerState,
    { getTelemetry }: RootSagaOptions,
    { payload: { data, provider }, meta }: WithSenderAction<ReturnType<typeof importItems.intent>>
): Generator {
    const telemetry = getTelemetry();
    const requestID = meta.request.id;
    const endpoint = meta.sender?.endpoint;

    /** Maintains pending items registry to track progress and properly report
     * ignored items if the import process fails or is cancelled mid-operation */
    const counts = { items: 0, files: 0 };
    const pendingItems = new Map<string, ItemImportIntent>(); /* Map<itemUUID, item> */
    /** Maps files to their respective items using shareId/itemId as keys,
     * allowing the UI's `useImportForm` to correctly associate and upload
     * files to their parent items after import completes */
    const pendingFiles: string[] = [];
    const filesForImport: IndexedByShareIdAndItemId<string[]> = {};
    const ignored = [...data.ignored];

    const passPlan: UserPassPlan = yield select(selectPassPlan);
    const userPlan: MaybeNull<PassPlanResponse> = yield select(selectUserPlan);
    const canImportFiles = isPaidPlan(passPlan) && userPlan?.DisplayName !== 'Pass Essentials';
    const URLAdvancedModesEnabled: boolean = yield select(selectFeatureFlag(PassFeature.PassAutofillUrlAdvancedModes));

    const sanitized = URLAdvancedModesEnabled
        ? data.vaults
        : data.vaults.map((vault) => ({
              ...vault,
              items: vault.items.map((item) =>
                  item.type === 'login'
                      ? {
                            ...item,
                            content: {
                                ...item.content,
                                autofillUrls: uniqueAutofillUrls(
                                    item.content.autofillUrls.flatMap(({ url, mode }) =>
                                        isAutofillModeDataOfTypeUrl(mode) ? [{ url, mode: AutofillMode.Default }] : []
                                    )
                                ),
                            },
                        }
                      : item
              ),
          }));

    Object.values(sanitized).forEach(({ items }) =>
        items.forEach((item) => {
            pendingItems.set(item.metadata.itemUuid, item);
            if (item.files) {
                counts.files += item.files.length;
                pendingFiles.push(...item.files);
            }
        })
    );

    /** The import report only tracks item data during the saga
     * execution. File handling is deferred to the UI layer which
     * will use the `filesForImport` map. All unprocessed files are
     * considered "ignored" in case of failure or cancellation */
    const getImportReport = (err?: unknown): ImportReport => {
        const error = err instanceof Error ? err.name : undefined;
        const pendingIgnored = Array.from(pendingItems.values().map(formatIgnoredItem));

        return {
            error,
            ignored: ignored.concat(...pendingIgnored),
            ignoredFiles: pendingFiles,
            importedAt: getEpoch(),
            provider,
            total: counts.items,
            totalFiles: counts.files,
            warnings: data.warnings,
        };
    };

    const importVaults = groupByKey(sanitized, 'shareId', { splitEmpty: true }).map(([vault, ...vaults]): ImportVault => ({
        ...vault,
        items: vault.items.concat(...vaults.map(prop('items'))),
    }));

    try {
        yield put(stopEventPolling());

        for (const vaultData of importVaults) {
            try {
                const shareId: string = vaultData.shareId ?? (yield call(createVaultForImport, vaultData.name));

                for (const importIntents of chunk(vaultData.items, MAX_BATCH_PER_IMPORT_REQUEST)) {
                    try {
                        assertNotAborted(state);

                        const items: ItemRevision[] = yield importItemsBatch({ shareId, importIntents });

                        items.forEach(({ data, shareId, itemId }) => {
                            const { itemUuid } = data.metadata;
                            const files = pendingItems.get(itemUuid)?.files;

                            if (canImportFiles && files && files.length > 0) {
                                filesForImport[shareId] = filesForImport[shareId] ?? {};
                                filesForImport[shareId][itemId] = files;
                            }

                            pendingItems.delete(itemUuid);
                        });

                        counts.items += items.length;
                        yield put(importItemsProgress(requestID, counts.items, { shareId, items }));
                    } catch (e) {
                        const errorMessage = getErrorMessage(e);
                        logger.warn(`[Saga::Import] Import batch error (${errorMessage})`);
                        yield put(
                            notification({
                                endpoint,
                                key: requestID,
                                type: 'error',
                                text: c('Error').t`Import failed for vault "${vaultData.name}": ${errorMessage}`,
                            })
                        );
                    }
                }
            } catch (e) {
                logger.warn(`[Saga::Import] Import error when creating vault (${getErrorMessage(e)})`);
                yield put(
                    notification({
                        key: requestID,
                        endpoint,
                        type: 'error',
                        text: c('Error').t`Vault "${vaultData.name}" could not be created`,
                    })
                );
            }
        }

        void telemetry?.push(
            createTelemetryEvent(
                TelemetryEventName.ImportCompletion,
                { item_count: counts.items, vaults: importVaults.length },
                { source: provider }
            )
        );

        assertNotAborted(state);

        yield put(
            importItems.success(requestID, {
                report: getImportReport(),
                files: filesForImport,
                endpoint,
            })
        );
    } catch (error) {
        yield put(importItems.failure(requestID, error, { endpoint, report: getImportReport(error) }));
    } finally {
        yield put(startEventPolling());
    }
}

/** When cancellation is requested during an active batch operation,
 * the current batch is allowed to complete before the import terminates.
 * This prevents data corruption and ensures accurate progress reporting. */
export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(importItems.intent.match, function* (action) {
        const state: ImportWorkerState = { aborted: false };

        const cancelTask: Task = yield fork(function* () {
            yield take(matchCancel(action.meta.request.id));
            state.aborted = true;
        });

        yield call(importWorker, state, options, action);
        cancelTask.cancel();
    });
}
