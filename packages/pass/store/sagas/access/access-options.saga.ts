import { select } from 'redux-saga/effects';

import { isVaultTarget } from '@proton/pass/lib/access/access.predicates';
import { toShareAccessKey } from '@proton/pass/lib/access/access.utils';
import type { InviteData } from '@proton/pass/lib/invites/invite.requests';
import { loadInvites } from '@proton/pass/lib/invites/invite.requests';
import { isItemInviteForItem } from '@proton/pass/lib/invites/invite.utils';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import { loadShareItemMembers, loadShareMembers } from '@proton/pass/lib/shares/share.requests';
import { getShareAccessOptions } from '@proton/pass/store/actions';
import type { ShareItem } from '@proton/pass/store/reducers';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectShareOrThrow } from '@proton/pass/store/selectors';
import type { ShareMember } from '@proton/pass/types/data/invites';
import { or } from '@proton/pass/utils/fp/predicates';

/** Access options resolution may duplicate member/invite data across
 * different `accessKeys` in the state tree. This is an accepted trade-off:
 * BE responses are context-specific (vault vs item), mutations are rare,
 * and it simplifies UI selection by avoiding share/item state reconciliation.
 * Fresh data is guaranteed through revalidation and lack of caching */
const shareAccessOptions = createRequestSaga({
    actions: getShareAccessOptions,
    call: function* ({ shareId, itemId }) {
        const share: ShareItem = yield select(selectShareOrThrow(shareId));
        const canManage = isShareManageable(share);
        const allInvites: Partial<InviteData> = canManage ? yield loadInvites(shareId) : {};
        const { invites = [], newUserInvites = [] } = allInvites;

        if (itemId !== undefined) {
            const members: ShareMember[] = yield loadShareItemMembers(shareId, itemId!);
            const itemAccessKey = toShareAccessKey({ shareId, itemId });

            return {
                [itemAccessKey]: {
                    members: members,
                    invites: invites.filter(or(isVaultTarget, isItemInviteForItem(itemId!))),
                    newUserInvites: newUserInvites.filter(or(isVaultTarget, isItemInviteForItem(itemId!))),
                },
            };
        }

        const members: ShareMember[] = yield loadShareMembers(shareId);
        const vaultAccessKey = toShareAccessKey({ shareId });
        const vaultInvites = invites.filter(isVaultTarget);
        const vaultnewUserInvites = newUserInvites.filter(isVaultTarget);

        return {
            [vaultAccessKey]: {
                members,
                invites: vaultInvites,
                newUserInvites: vaultnewUserInvites,
            },
        };
    },
});

export default [shareAccessOptions];
