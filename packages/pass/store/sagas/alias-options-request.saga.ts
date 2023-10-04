import { put, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { api } from '@proton/pass/api';
import type { AliasOptionsResponse } from '@proton/pass/types';

import { getAliasOptionsFailure, getAliasOptionsIntent, getAliasOptionsSuccess } from '../actions';
import type { AliasOptions } from '../reducers';

export const ALIAS_OPTIONS_VALIDITY_WINDOW = 10 * 60;

function* requestAliasOptions(action: ReturnType<typeof getAliasOptionsIntent>) {
    const {
        payload: { shareId },
        meta: { callback: onAliasOptionsIntentProcessed },
    } = action;

    try {
        const aliasOptions: AliasOptionsResponse = yield api({
            url: `pass/v1/share/${shareId}/alias/options`,
            method: 'get',
        }).then(({ Options }) => {
            if (!Options) throw new Error(c('Error').t`Alias options could not be resolved`);
            return Options;
        });

        const options: AliasOptions = {
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

        const aliasOptionsSuccessAction = getAliasOptionsSuccess({ options });
        yield put(aliasOptionsSuccessAction);
        onAliasOptionsIntentProcessed?.(aliasOptionsSuccessAction);
    } catch (e) {
        const aliasOptionsFailureAction = getAliasOptionsFailure(e);
        yield put(aliasOptionsFailureAction);
        onAliasOptionsIntentProcessed?.(aliasOptionsFailureAction);
    }
}

export default function* watcher() {
    yield takeEvery(getAliasOptionsIntent.match, requestAliasOptions);
}
