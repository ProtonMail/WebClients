import { call, fork, put, race, select, take, takeEvery } from 'redux-saga/effects';

import { api } from '../../../lib/api/api';
import { getItemKey } from '../../../lib/items/item.utils';
import { checkPasswordCompromised } from '../../../lib/monitor/compromised-password.request';
import { hasPasswordChanged } from '../../../lib/monitor/monitor.utils';
import type { CompromisedPasswordEntry } from '../../../lib/monitor/types';
import { isOnline } from '../../../lib/network/connectivity.utils';
import { isPaidPlan } from '../../../lib/user/user.predicates';
import type { ItemRevision } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import type { UserPassPlan } from '../../../types/api/plan';
import { logger } from '../../../utils/logger';
import { deobfuscate } from '../../../utils/obfuscate/xor';
import { compromisedPasswordUpdate, importItemsProgress, itemCreate, itemEdit } from '../../actions';
import type { ItemEditIntentAction } from '../../middleware/item-edit.middleware';
import { selectCompromisedPasswordsCache, selectFeatureFlag, selectPassPlan } from '../../selectors';
import type { RootSagaOptions } from '../../types';

function* isEnabled(): Generator<any, boolean, any> {
    const enabled: boolean = yield select(selectFeatureFlag(PassFeature.PassCompromisedPasswords));
    if (!enabled) return false;

    const plan: UserPassPlan = yield select(selectPassPlan);
    return isPaidPlan(plan);
}

function* checkItem(item: ItemRevision): Generator<any, void, any> {
    try {
        if (!isOnline(api.getState())) return;
        if (item.data.type !== 'login') return;

        const password = deobfuscate(item.data.content.password);
        if (!password) return;

        const check: Awaited<ReturnType<typeof checkPasswordCompromised>> = yield call(checkPasswordCompromised, password);
        if (check.status === 'not-modified') return;

        const entry: CompromisedPasswordEntry = {
            compromised: check.compromised,
            etag: check.etag,
            revision: item.revision,
        };
        yield put(compromisedPasswordUpdate({ item: { shareId: item.shareId, itemId: item.itemId }, entry }));
    } catch (err) {
        logger.warn('[Monitor::CompromisedPassword] background check failed', err);
    }
}

function* onItemCreateSuccess({ payload }: ReturnType<typeof itemCreate.success>): Generator<any, void, any> {
    if (!(yield call(isEnabled))) return;
    yield fork(checkItem, payload.item);
}

function* onItemEditIntent({ payload: editIntent, meta }: ItemEditIntentAction): Generator<any, void, any> {
    if (editIntent.type !== 'login') return;
    if (!(yield call(isEnabled))) return;

    const { itemId } = editIntent;

    const { success } = yield race({
        success: take((action: any) => itemEdit.success.match(action) && action.payload.itemId === itemId),
        failure: take((action: any) => itemEdit.failure.match(action) && action.payload.itemId === itemId),
    });

    if (!success) return;

    const { item } = success.payload;
    if (item.data.type !== 'login') return;

    const passwordChanged = !meta.previousItem || hasPasswordChanged(meta.previousItem.data, editIntent);
    if (passwordChanged) {
        yield fork(checkItem, item);
        return;
    }

    const cache: ReturnType<typeof selectCompromisedPasswordsCache> = yield select(selectCompromisedPasswordsCache);
    const prior = cache[getItemKey(item)];
    if (prior) {
        yield put(
            compromisedPasswordUpdate({
                item: { shareId: item.shareId, itemId: item.itemId },
                entry: { ...prior, revision: item.revision },
            })
        );
    }
}

function* onImportProgress({ payload }: ReturnType<typeof importItemsProgress>): Generator<any, void, any> {
    if (!(yield call(isEnabled))) return;
    for (const item of payload.items) yield fork(checkItem, item);
}

export default function* watcher(_: RootSagaOptions) {
    yield takeEvery(itemCreate.success.match, onItemCreateSuccess);
    yield takeEvery(itemEdit.intent.match, onItemEditIntent);
    yield takeEvery(importItemsProgress.match, onImportProgress);
}
