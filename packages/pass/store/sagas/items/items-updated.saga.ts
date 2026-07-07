import type { Action } from 'redux';
import { call, takeLatest } from 'redux-saga/effects';

import type { WithItems } from '@proton/pass/store/actions/enhancers/items';
import { isItemsAction } from '@proton/pass/store/actions/enhancers/items';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* onItemsAction({ onItemsUpdated }: RootSagaOptions, action: WithItems<Action>) {
    const { updated, batch } = action.meta.items;
    if (updated) yield call(onItemsUpdated, { report: !batch });
}

export default function* worker(options: RootSagaOptions) {
    yield takeLatest(isItemsAction, onItemsAction, options);
}
