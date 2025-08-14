import isEqual from 'lodash/isEqual';
import type { SagaIterator } from 'redux-saga';
import { call, delay, getContext, put, select, take } from 'redux-saga/effects';

import type { AesGcmCryptoKey } from '../../crypto/types';
import type { DbApi } from '../../indexedDb/db';
import type { LumoApi, RemoteStatus } from '../../remote/api';
import { convertNewAttachmentToApi } from '../../remote/conversion';
import type { Priority } from '../../remote/scheduler';
import type { IdMapEntry, LocalId, RemoteAttachment, RemoteId, ResourceType } from '../../remote/types';
import { deserializeAttachment, serializeAttachment } from '../../serialization';
import {
    type Attachment,
    type AttachmentId,
    type DeletedAttachment,
    type SerializedAttachment,
    type ShallowAttachment,
    type Space,
    cleanAttachment,
    getSpaceDek,
} from '../../types';
import { selectAttachmentById, selectRemoteIdFromLocal, selectSpaceById } from '../selectors';
import {
    type PullAttachmentRequest,
    type PushAttachmentFailure,
    type PushAttachmentRequest,
    type PushAttachmentSuccess,
    addAttachment,
    deleteAttachment,
    locallyDeleteAttachmentFromRemoteRequest,
    locallyRefreshAttachmentFromRemoteRequest,
    pullAttachmentFailure,
    pullAttachmentSuccess,
    pushAttachmentFailure,
    pushAttachmentNeedsRetry,
    pushAttachmentNoop,
    pushAttachmentSuccess,
} from '../slices/core/attachments';
import { addIdMapEntry } from '../slices/core/idmap';
import type { LumoState } from '../store';
import { waitForMapping } from './idmap';
import { ClientError, RETRY_PUSH_EVERY_MS, callWithRetry, isClientError } from './index';
import { waitForSpace } from './spaces';

/*** helpers ***/

function* saveDirtyAttachment(serializedAttachment: SerializedAttachment): SagaIterator {
    console.log('Saga triggered: saveDirtyAttachment', serializedAttachment);
    const dbApi: DbApi = yield getContext('dbApi');
    yield call([dbApi, dbApi.updateAttachment], serializedAttachment, {
        dirty: true,
    });
}

function* clearDirtyIfUnchanged(serializedAttachment: SerializedAttachment): SagaIterator<boolean> {
    console.log('Saga triggered: clearDirtyIfUnchanged', serializedAttachment);
    // fixme: possibly racy between getting `fresh` and storing the object
    // fixme: consider delegating the CAS to dbApi instead, which can manage the read-then-write inside a tx
    const dbApi: DbApi = yield getContext('dbApi');
    const localId = serializedAttachment.id;
    const fresh = yield call([dbApi, dbApi.getAttachmentById], localId);
    const { dirty: _a, ...a } = cleanAttachmentSerialized(fresh);
    const { dirty: _b, ...b } = cleanAttachmentSerialized(serializedAttachment);
    const unchanged = isEqual(a, b);
    // todo improvement: dbApi.clearDirtyAttachment() directly there
    if (unchanged) {
        yield call([dbApi, dbApi.updateAttachment], serializedAttachment, { dirty: false });
        return true;
    } else {
        console.log('clearDirtyIfUnchanged: found changed data: ', { a, b });
        return false;
    }
}

// Local helper function since cleanSerializedAttachment isn't available
function cleanAttachmentSerialized(attachment: SerializedAttachment): SerializedAttachment {
    const { id, spaceId, mimeType, uploadedAt, rawBytes, processing, error, encrypted, dirty, deleted } =
        attachment;
    return {
        id,
        ...(spaceId !== undefined && { spaceId }),
        ...(mimeType !== undefined && { mimeType }),
        uploadedAt,
        ...(rawBytes !== undefined && { rawBytes }),
        ...(processing && { processing: true }),
        ...(error && { error: true }),
        ...(encrypted ? { encrypted } : {}),
        ...(dirty && { dirty: true }),
        ...(deleted && { deleted: true }),
    };
}

export function* waitForAttachment(localId: LocalId): SagaIterator<Attachment> {
    const type = 'attachment';
    console.log(`Saga triggered: waitForAttachment: ${type} ${localId}`);
    const mapped: Attachment | undefined = yield select(selectAttachmentById(localId));
    if (mapped) {
        console.log(`waitForAttachment: requested ${type} ${localId} -> found immediately, returning value`);
        return mapped;
    }
    console.log(`waitForAttachment: requested ${type} ${localId} -> not ready, waiting`);
    const { payload: resource }: ReturnType<typeof addAttachment> = yield take(
        (a: any) => a.type === addAttachment.type && a.payload.id === localId
    );
    console.log(`waitForAttachment: requested ${type} ${localId} -> now available, returning value ${resource}`);
    return resource;
}

export function* serializeAttachmentSaga(
    attachment: Attachment,
    spaceDek?: AesGcmCryptoKey
): SagaIterator<SerializedAttachment> {
    const { id: localId, spaceId } = attachment;

    if (!spaceId) {
        throw new Error(`serializeAttachmentSaga ${localId}: attachment has no spaceId`);
    }

    let spaceDek_: AesGcmCryptoKey;
    if (spaceDek) {
        spaceDek_ = spaceDek;
    } else {
        const space: Space | undefined = yield select(selectSpaceById(spaceId));
        if (!space) {
            throw new Error(
                `serializeAttachmentSaga ${localId}: cannot get space dek: cannot find parent space ${spaceId}`
            );
        }
        spaceDek_ = yield call(getSpaceDek, space);
    }

    const serializedAttachment: SerializedAttachment | undefined = yield call(
        serializeAttachment,
        attachment,
        spaceDek_
    );
    if (!serializedAttachment) {
        throw new Error(`serializeAttachmentSaga ${localId}: cannot serialize attachment ${localId}`);
    }
    return serializedAttachment;
}

export function* deserializeAttachmentSaga(
    serializedAttachment: SerializedAttachment,
    spaceDek?: AesGcmCryptoKey
): SagaIterator<Attachment> {
    const { id: localId, spaceId } = serializedAttachment;

    if (!spaceId) {
        throw new Error(`deserializeAttachmentSaga ${localId}: attachment has no spaceId`);
    }

    let spaceDek_: AesGcmCryptoKey;
    if (spaceDek) {
        spaceDek_ = spaceDek;
    } else {
        const space: Space | undefined = yield select(selectSpaceById(spaceId));
        if (!space) {
            throw new Error(
                `deserializeAttachmentSaga ${localId}: cannot get space dek: cannot find parent space ${spaceId}`
            );
        }
        spaceDek_ = yield call(getSpaceDek, space);
    }

    console.log(`deserializeAttachmentSaga ${localId}: calling deserializeAttachment for remote`);
    const deserializedRemoteAttachment: Attachment | null = yield call(
        deserializeAttachment,
        serializedAttachment,
        spaceDek_
    );
    console.log(
        `deserializeAttachmentSaga ${localId}: got deserialized remote attachment result`,
        deserializedRemoteAttachment
    );
    if (!deserializedRemoteAttachment) {
        throw new Error(`deserializeAttachmentSaga ${localId}: cannot deserialize attachment ${localId} from remote`);
    }
    const cleanRemote = cleanAttachment(deserializedRemoteAttachment);
    return cleanRemote;
}

export function* softDeleteAttachmentFromRemote({ payload: localId }: { payload: AttachmentId }): SagaIterator<any> {
    console.log('Saga triggered: softDeleteAttachmentFromRemote', localId);
    const dbApi: DbApi = yield getContext('dbApi');
    yield put(deleteAttachment(localId)); // Redux
    yield call([dbApi, dbApi.softDeleteAttachment], localId, { dirty: false }); // IDB
}

export function* softDeleteAttachmentFromLocal({ payload: localId }: { payload: AttachmentId }): SagaIterator<any> {
    console.log('Saga triggered: softDeleteAttachmentFromLocal', localId);
    const dbApi: DbApi = yield getContext('dbApi');
    yield put(deleteAttachment(localId)); // Redux
    yield call([dbApi, dbApi.softDeleteAttachment], localId, { dirty: true }); // IDB
}

/*** loggers ***/

export function* logPushAttachmentSuccess({ payload }: { payload: PushAttachmentSuccess }): SagaIterator<any> {
    console.log('Saga triggered: logPushAttachmentSuccess', payload);
    console.log('push attachment success', payload);
}

export function* logPushAttachmentFailure({ payload }: { payload: PushAttachmentFailure }): SagaIterator<any> {
    console.log('Saga triggered: logPushAttachmentFailure', payload);
    console.error('push attachment failure', payload);
}

export function* logPushAttachmentNoop({ payload }: { payload: PushAttachmentRequest }): SagaIterator<any> {
    console.log('Saga triggered: logPushAttachmentNoop', payload);
    console.log('push attachment noop', payload);
}

export function* logPullAttachmentFailure({ payload: attachmentId }: { payload: AttachmentId }): SagaIterator<any> {
    console.log('Saga triggered: logPullAttachmentFailure', attachmentId);
    console.error(`get attachment ${attachmentId} failure`);
}

/*** sync: local -> remote ***/

function* httpPostAttachment(serializedAttachment: SerializedAttachment, priority: Priority): SagaIterator<IdMapEntry> {
    console.log('Saga triggered: httpPostAttachment', serializedAttachment);
    const type: ResourceType = 'attachment';
    const { id: localId, spaceId: localSpaceId } = serializedAttachment;

    if (!localSpaceId) {
        throw new Error(`httpPostAttachment ${localId}: attachment has no spaceId`);
    }

    const remoteSpaceId: RemoteId = yield call(waitForMapping, 'space', localSpaceId);
    const attachmentToApi = convertNewAttachmentToApi(serializedAttachment, remoteSpaceId);
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const remoteId = yield call([lumoApi, lumoApi.postAttachment], attachmentToApi, priority);
    if (!remoteId) {
        throw new ClientError(`client error while posting ${type} ${localId}, not retrying`);
    }
    const entry = { type, localId, remoteId };
    yield put(addIdMapEntry({ ...entry, saveToIdb: true }));
    return entry;
}

function* httpPutAttachment(
    serializedAttachment: SerializedAttachment,
    remoteId: RemoteId,
    priority: Priority
): SagaIterator<any> {
    console.log('Saga triggered: httpPutAttachment', { serializedAttachment, remoteId });
    const type: ResourceType = 'attachment';
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const { id: localId, spaceId: localSpaceId } = serializedAttachment;

    if (!localSpaceId) {
        throw new Error(`httpPutAttachment ${localId}: attachment has no spaceId`);
    }

    const remoteSpaceId: RemoteId = yield call(waitForMapping, 'space', localSpaceId);
    const attachmentToApi = convertNewAttachmentToApi(serializedAttachment, remoteSpaceId);
    const status: RemoteStatus = yield call([lumoApi, lumoApi.putAttachment], attachmentToApi, remoteId, priority);
    if (status === 'deleted') {
        console.log(`PUT ${type}: ${localId} was deleted remotely, deleting also locally: ${localId} ${remoteId})`);
        const deletedAttachment: DeletedAttachment = { ...serializedAttachment, deleted: true };
        yield put(locallyDeleteAttachmentFromRemoteRequest(deletedAttachment.id));
    }
}

function* httpDeleteAttachment(localId: LocalId, remoteId: RemoteId, priority: Priority): SagaIterator<RemoteStatus> {
    console.log('Saga triggered: httpDeleteAttachment', { localId, remoteId });
    const type: ResourceType = 'attachment';
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const status: RemoteStatus = yield call([lumoApi, lumoApi.deleteAttachment], remoteId, priority);
    if (status === 'deleted') {
        console.log(`DELETE ${type}: ${localId} was already deleted remotely, so the http delete was a noop`);
    }
    return status;
}

export function* pushAttachment({ payload }: { payload: PushAttachmentRequest }): SagaIterator<any> {
    console.log('Saga triggered: pushAttachment', payload);
    const type: ResourceType = 'attachment';
    const { id: localId } = payload;
    const priority = payload.priority || 'urgent';
    try {
        const dbApi: DbApi = yield getContext('dbApi');
        const remoteId: RemoteId | undefined = yield select(selectRemoteIdFromLocal(type, localId));
        const idbAttachment: SerializedAttachment | undefined = yield call([dbApi, dbApi.getAttachmentById], localId);

        // Deletion case
        if (idbAttachment) {
            // If there is an object in IDB and it has deleted+dirty flags, we push the deletion and exit
            const { deleted, dirty } = idbAttachment;
            if (deleted) {
                if (dirty) {
                    // DELETE
                    if (remoteId) {
                        const deleteArgs: [LocalId, RemoteId, Priority] = [localId, remoteId, priority];
                        yield call(callWithRetry, httpDeleteAttachment, deleteArgs);
                    }
                    // Clear the dirty flag in IDB, marking the deletion was synced
                    const updated: boolean = yield call(clearDirtyIfUnchanged, idbAttachment);
                    // Delete from redux, and if it was done before, it's a noop
                    yield put(deleteAttachment(localId));
                    if (updated) {
                        yield put(pushAttachmentSuccess(payload));
                    } else {
                        yield put(pushAttachmentNeedsRetry(payload));
                    }
                    return;
                } else {
                    // deletion was already synced, noop
                    yield put(pushAttachmentNoop(payload));
                    return;
                }
            }
        }

        // Encrypt the attachment for IDB and the remote
        const attachment: Attachment | undefined = yield select(selectAttachmentById(localId));
        if (!attachment) throw new Error(`cannot find ${type} ${localId} in Redux`);

        if (!attachment.spaceId) {
            console.log(
                `pushAttachment: attachment ${localId} is provisional (still in the composer area), so we don't push it.`
            );
            yield put(pushAttachmentNoop(payload));
            return;
        }

        const serializedAttachment: SerializedAttachment = yield call(serializeAttachmentSaga, attachment);

        // Save the attachment to IndexedDB with a dirty flag
        yield call(saveDirtyAttachment, serializedAttachment);

        // Choose between POST or PUT
        let entry: IdMapEntry | undefined;
        if (!remoteId) {
            // POST
            entry = yield call(callWithRetry, httpPostAttachment, [serializedAttachment, priority]);
        } else {
            // PUT
            yield call(callWithRetry, httpPutAttachment, [serializedAttachment, remoteId, priority]);
        }

        // Finish
        const updated: boolean = yield call(clearDirtyIfUnchanged, serializedAttachment);
        if (updated) {
            yield put(pushAttachmentSuccess({ ...payload, attachment, serializedAttachment, entry }));
        } else {
            yield put(pushAttachmentNeedsRetry(payload));
        }
    } catch (e) {
        // Retry unless it's a 4xx client error (in which case we expect retrying to fail again)
        console.error(e);
        if (isClientError(e)) {
            yield put(pushAttachmentFailure({ ...payload, error: `${e}` }));
        } else {
            yield put(pushAttachmentNeedsRetry(payload));
        }
    }
}

export function* retryPushAttachment({ payload }: { payload: PushAttachmentRequest }): SagaIterator<any> {
    console.log('Saga triggered: retryPushAttachment', payload);
    yield delay(RETRY_PUSH_EVERY_MS);
    yield call(pushAttachment, { payload: { ...payload, priority: 'background' } });
}

/*** sync: remote -> local ***/

export function* refreshAttachmentFromRemote({
    payload: remoteAttachment,
}: {
    payload: RemoteAttachment;
}): SagaIterator<any> {
    console.log('Saga triggered: refreshAttachmentFromRemote', remoteAttachment);
    const type = 'attachment';
    const dbApi: DbApi = yield getContext('dbApi');
    const { id: localId, spaceId: localSpaceId, remoteId } = remoteAttachment;

    if (!localSpaceId) {
        console.error(`refreshAttachmentFromRemote: attachment ${localId} has no spaceId`);
        return;
    }

    // Compare with object in Redux
    const localSpace: Space = yield call(waitForSpace, localSpaceId);
    const spaceDek: AesGcmCryptoKey = yield call(getSpaceDek, localSpace);
    const deserializedRemoteAttachment: Attachment | null = yield call(
        deserializeAttachment,
        remoteAttachment,
        spaceDek
    );
    if (!deserializedRemoteAttachment) {
        console.error(`refreshAttachmentFromRemote: cannot deserialize attachment ${localId} from remote`);
        return;
    }
    const cleanRemote = cleanAttachment(deserializedRemoteAttachment);
    const localAttachment: Attachment | undefined = yield select(selectAttachmentById(localId));
    if (localAttachment) {
        const cleanLocal = cleanAttachment(localAttachment);
        if (isEqual(cleanRemote, cleanLocal)) {
            console.log('refreshAttachmentFromRemote: received attachment is the same as the one in Redux, noop');
            return;
        }
    }

    // todo: if the attachment from payload is shallow (has empty `encrypted`), then don't update the item in Redux & IDB, i.e. abort.

    // Compare with object in IDB
    const idbAttachment: SerializedAttachment | undefined = yield call([dbApi, dbApi.getAttachmentById], localId);
    if (idbAttachment) {
        if (idbAttachment.dirty) {
            console.log(
                `Received a remote refresh for attachment ${localId}, but it is marked dirty locally, not updating`
            );
            return;
        }
        const cleanSerializedRemote = cleanAttachmentSerialized(remoteAttachment);
        const cleanSerializedLocal = cleanAttachmentSerialized(idbAttachment);
        if (isEqual(cleanSerializedRemote, cleanSerializedLocal)) {
            console.log('refreshAttachmentFromRemote: received attachment is the same as the one in IDB, noop');
            return;
        }
    }

    // Update locally
    yield put(addAttachment(cleanRemote)); // Redux
    yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: true })); // Redux
    yield call([dbApi, dbApi.updateAttachment], remoteAttachment, { dirty: false }); // IDB
}

export function* refreshAttachmentFromRemoteMessage({
    payload: shallowAttachment,
}: {
    payload: ShallowAttachment;
}): SagaIterator<any> {
    console.log('Saga triggered: refreshAttachmentFromRemoteMessage', shallowAttachment);
    const { id: localId, spaceId: localSpaceId } = shallowAttachment;

    if (!localSpaceId) {
        console.error(`refreshAttachmentFromRemoteMessage: attachment ${localId} has no spaceId`);
        return;
    }

    // Compare with object in Redux
    const cleanRemote = cleanAttachment(shallowAttachment);
    const localAttachment: Attachment | undefined = yield select(selectAttachmentById(localId));
    if (localAttachment) {
        const cleanLocal = cleanAttachment(localAttachment);
        if (isEqual(cleanRemote, cleanLocal)) {
            console.log(
                'refreshAttachmentFromRemoteMessage: received attachment is the same as the one in Redux, noop'
            );
            return;
        }
        if (cleanLocal.markdown) {
            // not shallow
            console.log(
                `refreshAttachmentFromRemoteMessage: attachment ${localId} in Redux is already full, ` +
                    `not updating it with a shallow one`
            );
        }
        yield put(addAttachment(cleanRemote)); // Redux
    }

    // Not placing a shallow attachment in IDB
}

export function* pullAttachment({ payload: { id: localId } }: { payload: PullAttachmentRequest }): SagaIterator<void> {
    console.log('Saga triggered: pullAttachment', localId);
    const type = 'attachment';
    try {
        const lumoApi: LumoApi = yield getContext('lumoApi');
        const remoteId: RemoteId | undefined = yield select((s: LumoState) => s.idmap.local2remote[type][localId]);
        if (!remoteId) {
            console.error(`GET ${type} ${localId}: Remote ID not found`);
            return;
        }
        const attachment: Attachment | undefined = yield select(selectAttachmentById(localId));
        if (!attachment) {
            console.log(`GET ${type} ${localId}: Cannot GET an attachment that isn't yet pushed to the server`);
            return;
        }
        if (!attachment.spaceId) {
            console.log(`GET ${type} ${localId}: Cannot GET an attachment without a spaceId`);
            return;
        }
        const localSpaceId = attachment.spaceId;
        const result: RemoteAttachment = yield call([lumoApi, lumoApi.getAttachment], remoteId, localSpaceId);
        yield put(pullAttachmentSuccess(result));
    } catch (e) {
        yield put(pullAttachmentFailure(localId));
    }
}

export function* processPullAttachmentResult({ payload }: { payload: RemoteAttachment }): SagaIterator<any> {
    console.log('Saga triggered: processPullAttachmentResult', payload);
    console.log('get attachment success' /* , payload */);
    const { deleted, id } = payload;
    if (deleted) {
        yield put(locallyDeleteAttachmentFromRemoteRequest(id));
    } else {
        yield put(locallyRefreshAttachmentFromRemoteRequest(payload));
    }
}
