import { select, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { isGroupShare, isVaultShare } from '../../../lib/shares/share.predicates';
import type { ItemRevision, Maybe } from '../../../types';
import { type Share, ShareType } from '../../../types';
import { shareDeleted, sharesEventNew } from '../../actions';
import type { Notification } from '../../actions/enhancers/notification';
import type { GroupsState } from '../../reducers/groups';
import { selectItem, selectShare } from '../../selectors';
import { selectGroups } from '../../selectors/groups';
import type { RootSagaOptions } from '../../types';

function* notificationForNewShare(share: Share, onNotification: (notification: Notification) => void) {
    // No notification except for group shares
    if (!isGroupShare(share)) return;

    const groups: GroupsState = yield select(selectGroups);
    const groupName = groups[share.groupId]?.name;
    if (!groupName) return; // Group should be in the list, abort if not

    if (share.targetType === ShareType.Item) {
        const item: ItemRevision = yield select(selectItem(share.shareId, share.targetId));
        const itemName = item.data.metadata.name;

        return onNotification({
            type: 'info',
            text: c('Info').t`You now have access to "Item ${itemName}" because your group ${groupName} has been granted access.`,
        });
    }

    const groupVaultShare = share as Share<ShareType.Vault>;
    const vaultName = groupVaultShare.content.name;

    return onNotification({
        type: 'info',
        text: c('Info').t`You now have access to "Vault ${vaultName}" because your group ${groupName} has been granted access.`,
    });
}

function* notificationForDeletedShare(shareId: string, onNotification: (notification: Notification) => void) {
    const share: Maybe<Share> = yield select(selectShare(shareId));

    if (!share) return;

    if (!isGroupShare(share)) {
        return onNotification({
            type: 'info',
            text: isVaultShare(share)
                ? c('Info').t`Vault "${share.content.name}" was removed.`
                : c('Info').t`An item previously shared with you was removed.`,
        });
    }

    const groups: GroupsState = yield select(selectGroups);
    const groupName = groups[share.groupId]?.name;
    if (!groupName) return; // Group should be in the list, abort if not

    return onNotification({
        type: 'info',
        text: c('Info').t`You no longer have access to some vaults or items because your group ${groupName}'s access was removed.`,
    });
}

function* notificationForNewSharesWorker({ onNotification }: RootSagaOptions, { payload: { shares } }: ReturnType<typeof sharesEventNew>) {
    for (const share of Object.values(shares)) {
        yield notificationForNewShare(share, onNotification);
    }
}

function* notificationForDeletedSharesWorker(
    { onNotification }: RootSagaOptions,
    { payload: { shareId } }: ReturnType<typeof shareDeleted>
) {
    yield notificationForDeletedShare(shareId, onNotification);
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(sharesEventNew.match, notificationForNewSharesWorker, options);
    yield takeEvery(shareDeleted.match, notificationForDeletedSharesWorker, options);
}
