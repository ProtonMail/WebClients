import { put, takeEvery } from 'redux-saga/effects';

import { createVault } from '@proton/pass/lib/vaults/vault.requests';
import { vaultCreationFailure, vaultCreationIntent, vaultCreationSuccess } from '@proton/pass/store/actions';
import type { Maybe, ShareType } from '@proton/pass/types';
import type { Share } from '@proton/pass/types';

export function* createVaultWorker({
    payload,
    meta,
}: ReturnType<typeof vaultCreationIntent>): Generator<unknown, Maybe<string>> {
    try {
        const share: Share<ShareType.Vault> = yield createVault({ content: payload.content });
        yield put(vaultCreationSuccess(meta.request.id, { share }));
        return share.shareId;
    } catch (e) {
        yield put(vaultCreationFailure(meta.request.id, payload, e));
    }
}

export default function* watcher() {
    yield takeEvery(vaultCreationIntent.match, createVaultWorker);
}
