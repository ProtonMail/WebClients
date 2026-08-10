import { call, fork, put, race, select, take, takeEvery } from 'redux-saga/effects';

import { isPasswordCompromised } from '@proton/pass/lib/monitor/compromised-password.request';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { compromisedPasswordUpdate, importItemsProgress, itemCreate, itemEdit } from '@proton/pass/store/actions';
import { selectItem, selectPassPlan } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, Maybe } from '@proton/pass/types';
import type { UserPassPlan } from '@proton/pass/types/api/plan';
import { logger } from '@proton/pass/utils/logger';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

function* checkItem(item: ItemRevision): Generator<any, void, any> {
    try {
        if (item.data.type !== 'login') return;

        const plan: UserPassPlan = yield select(selectPassPlan);
        if (!isPaidPlan(plan)) return;

        const password = deobfuscate(item.data.content.password);
        if (!password) return;

        const compromised: boolean = yield call(isPasswordCompromised, password);
        yield put(compromisedPasswordUpdate({ item: { shareId: item.shareId, itemId: item.itemId }, compromised }));
    } catch (err) {
        logger.warn('[Monitor::CompromisedPassword] background check failed', err);
    }
}

function* onItemCreateSuccess({ payload }: ReturnType<typeof itemCreate.success>) {
    yield fork(checkItem, payload.item);
}

function* onItemEditIntent({ payload: editIntent }: ReturnType<typeof itemEdit.intent>) {
    if (editIntent.type !== 'login') return;

    const { shareId, itemId } = editIntent;
    const prevItem: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
    const prevPassword = prevItem?.data.type === 'login' ? deobfuscate(prevItem.data.content.password) : undefined;

    const { success } = yield race({
        success: take((action: any) => itemEdit.success.match(action) && action.payload.itemId === itemId),
        failure: take((action: any) => itemEdit.failure.match(action) && action.payload.itemId === itemId),
    });

    if (!success) return;

    const { item } = success.payload;
    if (item.data.type !== 'login') return;

    const nextPassword = deobfuscate(item.data.content.password);
    if (nextPassword && nextPassword !== prevPassword) yield fork(checkItem, item);
}

function* onImportProgress({ payload }: ReturnType<typeof importItemsProgress>) {
    for (const item of payload.items) yield fork(checkItem, item);
}

export default function* watcher(_: RootSagaOptions) {
    yield takeEvery(itemCreate.success.match, onItemCreateSuccess);
    yield takeEvery(itemEdit.intent.match, onItemEditIntent);
    yield takeEvery(importItemsProgress.match, onImportProgress);
}
