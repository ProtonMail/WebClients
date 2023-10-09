import { put, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import type { AliasDetailsResponse } from '@proton/pass/types';

import { getAliasDetailsFailure, getAliasDetailsIntent, getAliasDetailsSuccess } from '../actions';

function* requestAliasDetails(action: ReturnType<typeof getAliasDetailsIntent>) {
    const {
        payload: { shareId, itemId, aliasEmail },
        meta: { request },
    } = action;
    try {
        const result: { Alias: AliasDetailsResponse } = yield api({
            url: `pass/v1/share/${shareId}}/alias/${itemId}`,
            method: 'get',
        });

        const mailboxes = result.Alias.Mailboxes.map(({ Email, ID }) => ({ id: ID, email: Email }));
        yield put(getAliasDetailsSuccess(request.id, { aliasEmail, mailboxes }));
    } catch (e) {
        yield put(getAliasDetailsFailure(request.id, { aliasEmail }, e));
    }
}

export default function* watcher() {
    yield takeEvery(getAliasDetailsIntent.match, requestAliasDetails);
}
