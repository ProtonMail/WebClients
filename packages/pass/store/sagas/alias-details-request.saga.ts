import { put, takeLeading } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import type { AliasDetailsResponse } from '@proton/pass/types';

import { getAliasDetailsFailure, getAliasDetailsIntent, getAliasDetailsSuccess } from '../actions';

function* requestAliasDetails(action: ReturnType<typeof getAliasDetailsIntent>) {
    const {
        payload: { shareId, itemId, aliasEmail },
    } = action;
    try {
        const {
            Alias: { Mailboxes },
        }: { Alias: AliasDetailsResponse } = yield api({
            url: `pass/v1/share/${shareId}}/alias/${itemId}`,
            method: 'get',
        });

        yield put(
            getAliasDetailsSuccess({
                aliasEmail,
                mailboxes: Mailboxes.map(({ Email, ID }) => ({ id: ID, email: Email })),
            })
        );
    } catch (e) {
        yield put(getAliasDetailsFailure({ aliasEmail }, e));
    }
}

export default function* watcher() {
    yield takeLeading(getAliasDetailsIntent.match, requestAliasDetails);
}
