import { put, takeLeading } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import type { AliasDetailsResponse } from '@proton/pass/types';

import { aliasDetailsRequestFailure, aliasDetailsRequestSuccess, aliasDetailsRequested } from '../actions';

function* requestAliasDetails(action: ReturnType<typeof aliasDetailsRequested>) {
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
            aliasDetailsRequestSuccess({
                aliasEmail,
                mailboxes: Mailboxes.map(({ Email, ID }) => ({ id: ID, email: Email })),
            })
        );
    } catch (e) {
        yield put(aliasDetailsRequestFailure({ aliasEmail }, e));
    }
}

export default function* watcher() {
    yield takeLeading(aliasDetailsRequested.match, requestAliasDetails);
}
