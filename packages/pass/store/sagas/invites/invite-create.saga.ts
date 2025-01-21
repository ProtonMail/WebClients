import { put, select, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { AccessTarget } from '@proton/pass/lib/access/types';
import { getPrimaryPublicKeyForEmail } from '@proton/pass/lib/auth/address';
import { createNewUserInvites, createUserInvites } from '@proton/pass/lib/invites/invite.requests';
import type { InviteBatchResult } from '@proton/pass/lib/invites/invite.utils';
import { concatInviteResults } from '@proton/pass/lib/invites/invite.utils';
import {
    inviteBatchCreateFailure,
    inviteBatchCreateIntent,
    inviteBatchCreateSuccess,
} from '@proton/pass/store/actions';
import { syncAccess } from '@proton/pass/store/actions/creators/polling';
import { selectAccessMembers, selectPassPlan } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import type { InviteMemberDTO, InviteUserDTO } from '@proton/pass/types/data/invites.dto';
import { partition } from '@proton/pass/utils/array/partition';

function* createInviteWorker(
    { onNotification }: RootSagaOptions,
    { payload, meta: { request } }: ReturnType<typeof inviteBatchCreateIntent>
) {
    const count = payload.members.length;
    const plan: UserPassPlan = yield select(selectPassPlan);
    const b2b = plan === UserPassPlan.BUSINESS;

    try {
        const shareId = payload.shareId;
        const itemId: Maybe<string> = payload.target === AccessTarget.Item ? payload.itemId : undefined;

        /** Filter out members that may be already invited or members of the vault */
        const currentMembers: Set<string> = yield select(selectAccessMembers(shareId, itemId));
        const members = payload.members.filter(({ value }) => !currentMembers.has(value.email));

        /** resolve each member's public key: if the member is not a
         * proton user, `publicKey` will be `undefined` and we should
         * treat it as as a new user invite */
        const membersDTO: InviteMemberDTO[] = yield Promise.all(
            members.map<Promise<InviteMemberDTO>>(async ({ value: { email, role } }) => ({
                email: email,
                publicKey: await getPrimaryPublicKeyForEmail(email),
                role,
            }))
        );

        const [users, newUsers] = partition(
            membersDTO /** split existing users from new users  */,
            (dto): dto is InviteUserDTO => 'publicKey' in dto && dto.publicKey !== undefined
        );

        const failedUsers: InviteBatchResult[] = yield createUserInvites(shareId, itemId, users, b2b);
        const failedNewUsers: InviteBatchResult[] = yield createNewUserInvites(shareId, itemId, newUsers, b2b);
        const results = concatInviteResults(failedUsers.concat(failedNewUsers));

        const totalFailure = !results.ok && results.failed.length === members.length;
        const batchFailures = results.ok ? 0 : results.failed.length;
        const hasFailures = !results.ok && batchFailures > 0;
        const invitesCount = members.length - batchFailures;

        if (totalFailure) throw new Error(results.error ?? 'Unknown error');

        if (hasFailures) {
            onNotification?.({
                type: 'error',
                text:
                    // Translator: list of failed invited emails is appended
                    c('Warning').t`Could not send invitations to the following addresses:` +
                    ` ${results.failed.join(', ')}. ${results.error}`,
            });
        }

        yield put(inviteBatchCreateSuccess(request.id, { shareId, itemId, count: invitesCount }));
        yield put(syncAccess(payload));
    } catch (error: unknown) {
        yield put(inviteBatchCreateFailure(request.id, error, count));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(inviteBatchCreateIntent.match, createInviteWorker, options);
}
