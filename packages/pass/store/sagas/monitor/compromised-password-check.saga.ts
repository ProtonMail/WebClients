import { call, fork, put, race, select, take, takeEvery } from 'redux-saga/effects';

import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { checkPasswordCompromised } from '@proton/pass/lib/monitor/compromised-password.request';
import { hasPasswordChanged } from '@proton/pass/lib/monitor/monitor.utils';
import type { CompromisedPasswordEntry } from '@proton/pass/lib/monitor/types';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { compromisedPasswordUpdate, importItemsProgress, itemCreate, itemEdit } from '@proton/pass/store/actions';
import type { ItemEditIntentAction } from '@proton/pass/store/middleware/item-edit.middleware';
import { selectCompromisedPasswordsCache, selectFeatureFlag, selectPassPlan } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import type { UserPassPlan } from '@proton/pass/types/api/plan';
import { logger } from '@proton/pass/utils/logger';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

function* isEnabled(): Generator<any, boolean, any> {
    const enabled: boolean = yield select(selectFeatureFlag(PassFeature.Pass__V1_40__CompromisedPasswords));
    if (!enabled) return false;

    const plan: UserPassPlan = yield select(selectPassPlan);
    return isPaidPlan(plan);
}

function* checkItem(item: ItemRevision): Generator<any, void, any> {
    try {
        if (item.data.type !== 'login') return;

        const password = deobfuscate(item.data.content.password);
        if (!password) return;

        const check: Awaited<ReturnType<typeof checkPasswordCompromised>> = yield call(checkPasswordCompromised, password);
        if (check.status === 'not-modified') return;

        const entry: CompromisedPasswordEntry = {
            compromised: check.compromised,
            etag: check.etag,
            checkedAt: Date.now(),
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
