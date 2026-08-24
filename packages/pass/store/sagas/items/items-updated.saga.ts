import type { Action } from 'redux';
import { call, takeLatest } from 'redux-saga/effects';

import type { WithItems } from '../../actions/enhancers/items';
import { isItemsAction } from '../../actions/enhancers/items';
import type { RootSagaOptions } from '../../types';

function* onItemsAction({ onItemsUpdated }: RootSagaOptions, action: WithItems<Action>) {
    const { updated, batch } = action.meta.items;
    if (updated) yield call(onItemsUpdated, { report: !batch });
}

export default function* worker(options: RootSagaOptions) {
    yield takeLatest(isItemsAction, onItemsAction, options);
}
