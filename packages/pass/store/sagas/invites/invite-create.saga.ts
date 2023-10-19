import { put, select, takeEvery } from 'redux-saga/effects';

import { getPrimaryPublicKeyForEmail } from '@proton/pass/lib/auth/address';
import { createInvite, createNewUserInvite } from '@proton/pass/lib/invites/invite.requests';
import { moveItem } from '@proton/pass/lib/items/item.requests';
import { createVault } from '@proton/pass/lib/vaults/vault.requests';
import { inviteCreationFailure, inviteCreationIntent, inviteCreationSuccess } from '@proton/pass/store/actions';
import { selectFeatureFlag, selectItemByShareIdAndId } from '@proton/pass/store/selectors';
import type { ItemRevision, Maybe, Share, ShareType } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

/* Depending on the result of the public key for the invited email,
 * adapt the invite creation process */
function* createInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteCreationIntent>) {
    try {
        const allowNewUser: boolean = yield select(selectFeatureFlag(PassFeature.PassSharingNewUsers));
        const invitedPublicKey: Maybe<string> = yield getPrimaryPublicKeyForEmail(payload.email);
        if (!invitedPublicKey && !allowNewUser) throw new Error();

        if (payload.withVaultCreation) {
            const { name, description, icon, color, item, ...inviteCreate } = payload;
            const itemToMove: Maybe<ItemRevision> = yield select(selectItemByShareIdAndId(item.shareId, item.itemId));
            if (itemToMove === undefined) throw new Error();

            const vaultContent = { name, description, display: { icon, color } };

            const createdShare: Share<ShareType.Vault> = yield createVault({ content: vaultContent });
            const movedItem: ItemRevision = yield moveItem(itemToMove, item.shareId, createdShare.shareId);

            yield invitedPublicKey
                ? createInvite({ ...inviteCreate, shareId: createdShare.shareId, invitedPublicKey })
                : createNewUserInvite({ ...inviteCreate, shareId: createdShare.shareId });

            yield put(
                inviteCreationSuccess(request.id, {
                    item,
                    movedItem,
                    share: createdShare,
                    shareId: createdShare.shareId,
                    withVaultCreation: true,
                })
            );

            return;
        }

        yield invitedPublicKey ? createInvite({ ...payload, invitedPublicKey }) : createNewUserInvite(payload);
        yield put(inviteCreationSuccess(request.id, { withVaultCreation: false, shareId: payload.shareId }));
    } catch (err) {
        yield put(inviteCreationFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(inviteCreationIntent.match, createInviteWorker);
}
