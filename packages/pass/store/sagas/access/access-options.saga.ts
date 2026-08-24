import { select } from 'redux-saga/effects';

import { isVaultTarget } from '../../../lib/access/access.predicates';
import { toShareAccessKey } from '../../../lib/access/access.utils';
import type { InviteData } from '../../../lib/invites/invite.requests';
import { loadInvites } from '../../../lib/invites/invite.requests';
import { isItemInviteForItem } from '../../../lib/invites/invite.utils';
import { isShareManageable } from '../../../lib/shares/share.predicates';
import { loadItemMembers, loadVaultMembers } from '../../../lib/shares/share.requests';
import type { ShareMember } from '../../../types/data/invites';
import { or } from '../../../utils/fp/predicates';
import { getShareAccessOptions } from '../../actions';
import type { ShareItem } from '../../reducers';
import { createRequestSaga } from '../../request/sagas';
import { selectShareOrThrow } from '../../selectors';

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
            const members: ShareMember[] = yield loadItemMembers(shareId, itemId!);
            const itemAccessKey = toShareAccessKey({ shareId, itemId });

            return {
                [itemAccessKey]: {
                    members: members,
                    invites: invites.filter(or(isVaultTarget, isItemInviteForItem(itemId!))),
                    newUserInvites: newUserInvites.filter(or(isVaultTarget, isItemInviteForItem(itemId!))),
                },
            };
        }

        const members: ShareMember[] = yield loadVaultMembers(shareId);
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
