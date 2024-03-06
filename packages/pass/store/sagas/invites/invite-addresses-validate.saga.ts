import { put, takeEvery } from 'redux-saga/effects';

import { checkInviteAddresses } from '@proton/pass/lib/invites/invite.requests';
import {
    inviteAddressesValidateFailure,
    inviteAddressesValidateIntent,
    inviteAddressesValidateSuccess,
} from '@proton/pass/store/actions';

function* validateInviteAddressesWorker({
    payload: { shareId, emails },
    meta: { request },
}: ReturnType<typeof inviteAddressesValidateIntent>) {
    try {
        const validAddresses: string[] = yield checkInviteAddresses(shareId, emails);
        const result = Object.fromEntries(emails.map((email) => [email, validAddresses.includes(email)]));
        yield put(inviteAddressesValidateSuccess(request.id, result));
    } catch (err) {
        yield put(inviteAddressesValidateFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(inviteAddressesValidateIntent.match, validateInviteAddressesWorker);
}
