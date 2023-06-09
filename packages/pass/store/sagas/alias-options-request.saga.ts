import { put, takeLeading } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import type { AliasOptionsResponse } from '@proton/pass/types';

import { aliasOptionsRequestFailure, aliasOptionsRequestSuccess, aliasOptionsRequested } from '../actions';
import type { AliasState } from '../reducers';

export const ALIAS_OPTIONS_VALIDITY_WINDOW = 10 * 60;

function* requestAliasOptions(action: ReturnType<typeof aliasOptionsRequested>) {
    const {
        payload: { shareId },
        meta: { callback: onAliasOptionsIntentProcessed },
    } = action;

    try {
        const aliasOptions: AliasOptionsResponse = yield api({
            url: `pass/v1/share/${shareId}/alias/options`,
            method: 'get',
        }).then(({ Options }) => Options!);

        const options: AliasState['aliasOptions'] = {
            suffixes: aliasOptions.Suffixes.map((data) => ({
                signedSuffix: data.SignedSuffix!,
                suffix: data.Suffix!,
                isCustom: data.IsCustom!,
                domain: data.Domain!,
            })),
            mailboxes: aliasOptions.Mailboxes.map((mailbox) => ({
                email: mailbox.Email,
                id: mailbox.ID,
            })),
        };

        const aliasOptionsSuccessAction = aliasOptionsRequestSuccess({ options });
        yield put(aliasOptionsSuccessAction);
        onAliasOptionsIntentProcessed?.(aliasOptionsSuccessAction);
    } catch (e) {
        const aliasOptionsFailureAction = aliasOptionsRequestFailure(e);
        yield put(aliasOptionsFailureAction);
        onAliasOptionsIntentProcessed?.(aliasOptionsFailureAction);
    }
}

export default function* watcher() {
    yield takeLeading(aliasOptionsRequested.match, requestAliasOptions);
}
