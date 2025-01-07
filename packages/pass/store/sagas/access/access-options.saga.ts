import { select } from 'redux-saga/effects';

import type { InviteData } from '@proton/pass/lib/invites/invite.requests';
import { loadInvites } from '@proton/pass/lib/invites/invite.requests';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import { loadShareItemMembers, loadShareMembers } from '@proton/pass/lib/shares/share.requests';
import { getShareAccessOptions } from '@proton/pass/store/actions';
import type { ShareItem } from '@proton/pass/store/reducers';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectShareOrThrow } from '@proton/pass/store/selectors';
import { ShareType } from '@proton/pass/types';
import type { InviteBase, ShareMember } from '@proton/pass/types/data/invites';

/** Only the owner or the manager of a share can manage the invites.
 * Only request the members if the share is actually shared. */
const shareAccessOptions = createRequestSaga({
    actions: getShareAccessOptions,
    call: function* ({ shareId, itemId }) {
        const share: ShareItem = yield select(selectShareOrThrow(shareId));

        const members: ShareMember[] = !itemId
            ? yield loadShareMembers(shareId)
            : yield loadShareItemMembers(shareId, itemId);

        const inviteData: Partial<InviteData> = isShareManageable(share) ? yield loadInvites(shareId) : {};
        const inviteFilter = itemId
            ? ({ targetType, targetId }: InviteBase) => targetType === ShareType.Item && targetId === itemId
            : ({ targetType }: InviteBase) => targetType === ShareType.Vault;
        const invites: Partial<InviteData> = {
            invites: inviteData.invites?.filter(inviteFilter),
            newUserInvites: inviteData.newUserInvites?.filter(inviteFilter),
        };

        return { shareId, itemId, members, ...invites };
    },
});

export default [shareAccessOptions];
