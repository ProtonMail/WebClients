import { put, select, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { getPrimaryPublicKeyForEmail } from '@proton/pass/lib/auth/address';
import { createNewUserInvites, createUserInvites } from '@proton/pass/lib/invites/invite.requests';
import {
    inviteBatchCreateFailure,
    inviteBatchCreateIntent,
    inviteBatchCreateSuccess,
} from '@proton/pass/store/actions';
import { selectAccessMembers, selectPassPlan } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import type { InviteMemberDTO, InviteUserDTO } from '@proton/pass/types/data/invites.dto';
import { partition } from '@proton/pass/utils/array/partition';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

function* createInviteWorker(
    { onNotification }: RootSagaOptions,
    { payload, meta: { request } }: ReturnType<typeof inviteBatchCreateIntent>
) {
    const count = payload.members.length;
    const plan: UserPassPlan = yield select(selectPassPlan);

    try {
        const shareId = payload.shareId;
        const itemId: Maybe<string> = payload.shareType === ShareType.Item ? payload.itemId : undefined;

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

        /** Both `createUserInvites` & `createNewUserInvite` return the
         * list of emails which could not be sent out. On success, both
         * should be empty */
        const failedUsers: string[] = yield createUserInvites(shareId, itemId, users);
        const failedNewUsers: string[] = yield createNewUserInvites(shareId, itemId, newUsers);
        const failed = failedUsers.concat(failedNewUsers);

        const totalFailure = failed.length === members.length;
        const hasFailures = failedUsers.length > 0 || failedNewUsers.length > 0;

        if (totalFailure) throw new Error('Could not send invitations');

        if (hasFailures) {
            onNotification?.({
                type: 'error',
                // Translator: list of failed invited emails is appended
                text: c('Warning').t`Could not send invitations to the following addresses:` + ` ${failed.join(', ')}`,
            });
        }

        yield put(inviteBatchCreateSuccess(request.id, { shareId, itemId, count: members.length - failed.length }));
    } catch (error: unknown) {
        console.warn(error);
        /** Fine-tune the error message when a B2B user
         * reaches the 100 members per vault hard-limit */
        if (plan === UserPassPlan.BUSINESS && error instanceof Error && 'data' in error) {
            const apiError = error as any;
            const { code } = getApiError(apiError);

            if (code === PassErrorCode.RESOURCE_LIMIT_EXCEEDED) {
                apiError.data.Error = c('Warning').t`Please contact us to investigate the issue`;
            }
        }

        yield put(inviteBatchCreateFailure(request.id, error, count));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(inviteBatchCreateIntent.match, createInviteWorker, options);
}
