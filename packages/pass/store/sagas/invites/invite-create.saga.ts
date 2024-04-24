import { call, put, select, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { getPrimaryPublicKeyForEmail } from '@proton/pass/lib/auth/address';
import { createNewUserInvites, createUserInvites } from '@proton/pass/lib/invites/invite.requests';
import { moveItem } from '@proton/pass/lib/items/item.requests';
import { createVault } from '@proton/pass/lib/vaults/vault.requests';
import {
    inviteBatchCreateFailure,
    inviteBatchCreateIntent,
    inviteBatchCreateSuccess,
    sharedVaultCreated,
} from '@proton/pass/store/actions';
import { selectItem, selectPassPlan, selectVaultSharedWithEmails } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemMoveDTO, ItemRevision, Maybe, Share, ShareType } from '@proton/pass/types';
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
        const shareId: string = !payload.withVaultCreation
            ? payload.shareId
            : yield call(function* () {
                  /** create a new vault and move the item provided in the
                   * action's payload if the user is creating an invite through
                   * the `move to a new shared vault` flow */
                  const { name, description, icon, color, item } = payload;
                  const vaultContent = { name, description, display: { icon, color } };
                  const share: Share<ShareType.Vault> = yield createVault({ content: vaultContent });

                  const itemToMove: Maybe<ItemRevision> = item
                      ? yield select(selectItem(item.shareId, item.itemId))
                      : undefined;

                  const move: Maybe<ItemMoveDTO> =
                      itemToMove && item
                          ? { before: itemToMove, after: yield moveItem(itemToMove, item.shareId, share.shareId) }
                          : undefined;

                  yield put(sharedVaultCreated({ share, move }));
                  return share.shareId;
              });

        /** Filter out members that may be already invited or members of the vault */
        const vaultSharedWith: Set<string> = yield select(selectVaultSharedWithEmails(shareId));
        const members = payload.members.filter(({ value }) => !vaultSharedWith.has(value.email));

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
        const failedUsers: string[] = yield createUserInvites(shareId, users);
        const failedNewUsers: string[] = yield createNewUserInvites(shareId, newUsers);
        const failed = failedUsers.concat(failedNewUsers);

        const totalFailure = failed.length === members.length;
        const hasFailures = failedUsers.length > 0 || failedNewUsers.length > 0;

        if (totalFailure) throw new Error('Could not send invitations');

        if (hasFailures) {
            onNotification?.({
                type: 'error',
                // Translator: list of failed invited emails is appended
                text: c('Warning').t`Could not send invitations to the following addresses :` + ` ${failed.join(', ')}`,
            });
        }

        yield put(inviteBatchCreateSuccess(request.id, { shareId }, members.length - failed.length));
    } catch (error: unknown) {
        /** Fine-tune the error message when a B2B user
         * reaches the 100 members per vault hard-limit */
        if (plan === UserPassPlan.BUSINESS && error instanceof Error && 'data' in error) {
            const apiError = error as any;
            const { code } = getApiError(apiError);

            if (code === PassErrorCode.RESOURCE_LIMIT_EXCEEDED) {
                apiError.data.Error = c('Warning').t`Please contact us for investigating the issue`;
            }
        }

        yield put(inviteBatchCreateFailure(request.id, error, count));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(inviteBatchCreateIntent.match, createInviteWorker, options);
}
