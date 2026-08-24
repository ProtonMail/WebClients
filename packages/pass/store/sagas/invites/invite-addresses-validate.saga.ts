import { put, takeEvery } from 'redux-saga/effects';

import { wait } from '@proton/shared/lib/helpers/promise';

import { checkInviteAddresses } from '../../../lib/invites/invite.requests';
import { inviteAddressesValidateFailure, inviteAddressesValidateIntent, inviteAddressesValidateSuccess } from '../../actions';

function* validateInviteAddressesWorker({
    payload: { shareId, emails },
    meta: { request },
}: ReturnType<typeof inviteAddressesValidateIntent>) {
    try {
        yield wait(50);
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
