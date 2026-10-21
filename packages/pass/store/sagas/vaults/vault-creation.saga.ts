import { put, takeEvery } from 'redux-saga/effects';

import { createVault } from '../../../lib/vaults/vault.requests';
import type { Share, ShareType } from '../../../types/data/shares';
import type { Maybe } from '../../../types/utils';
import { vaultCreationFailure, vaultCreationIntent, vaultCreationSuccess } from '../../actions/creators/vault';

export function* createVaultWorker({ payload, meta }: ReturnType<typeof vaultCreationIntent>): Generator<unknown, Maybe<string>> {
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
