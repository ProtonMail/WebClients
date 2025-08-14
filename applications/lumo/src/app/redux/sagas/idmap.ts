import type { SagaIterator } from 'redux-saga';
import { call, getContext, select, take } from 'redux-saga/effects';

import type { DbApi } from '../../indexedDb/db';
import type { IdMapEntry, LocalId, RemoteId, ResourceType } from '../../remote/types';
import { addIdMapEntry } from '../slices/core/idmap';
import type { LumoState } from '../store';

export function* waitForMapping(type: ResourceType, localId: LocalId): SagaIterator<RemoteId> {
    console.log('Saga triggered: waitForMapping', { type, localId });
    const mapped: RemoteId = yield select((s: LumoState) => s.idmap.local2remote[type][localId]);
    if (mapped) {
        console.log(`waitForMapping: requested ${type} ${localId} -> found immediately, returning remote id ${mapped}`);
        return mapped;
    }
    console.log(`waitForMapping: requested ${type} ${localId} -> not ready, waiting`);
    const {
        payload: { remoteId },
    }: ReturnType<typeof addIdMapEntry> = yield take(
        (a: any) => a.type === addIdMapEntry.type && a.payload.type === type && a.payload.localId === localId
    );
    console.log(`waitForMapping: requested ${type} ${localId} -> now available, returning remote id ${remoteId}`);
    return remoteId;
}

export function* saveIdMapToIdb({ payload: entry }: { payload: IdMapEntry }): SagaIterator {
    console.log('Saga triggered: saveIdMapToIdb', entry);
    const dbApi: DbApi = yield getContext('dbApi');
    yield call([dbApi, dbApi.addRemoteId], entry);
}

export function* considerSavingIdMapToIdb({ payload }: { payload: IdMapEntry & { saveToIdb: boolean } }): SagaIterator {
    console.log('Saga triggered: considerSavingIdMapToIdb', payload);
    const { saveToIdb, ...entry } = payload;
    if (saveToIdb) {
        yield call(saveIdMapToIdb, { payload: entry });
    }
}
