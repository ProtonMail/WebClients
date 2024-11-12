import { select } from 'redux-saga/effects';

import type { InviteData } from '@proton/pass/lib/invites/invite.requests';
import { loadInvites } from '@proton/pass/lib/invites/invite.requests';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import { loadShareMembers } from '@proton/pass/lib/shares/share.requests';
import { getShareAccessOptions } from '@proton/pass/store/actions';
import type { ShareItem } from '@proton/pass/store/reducers';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectShareOrThrow } from '@proton/pass/store/selectors';
import type { ShareMember } from '@proton/pass/types';

/** Only the owner or the manager of a share can manage the invites.
 * Only request the members if the share is actually shared. */
const shareAccessOptions = createRequestSaga({
    actions: getShareAccessOptions,
    call: function* ({ shareId }) {
        const share: ShareItem = yield select(selectShareOrThrow(shareId));
        const members: ShareMember[] = share.shared ? yield loadShareMembers(shareId) : [];
        const invites: Partial<InviteData> = isShareManageable(share) ? yield loadInvites(shareId) : {};

        return { shareId, members, ...invites };
    },
});

export default [shareAccessOptions];
