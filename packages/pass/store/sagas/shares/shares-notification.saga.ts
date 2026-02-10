import { select, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { isGroupShare, isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { shareEventDelete, sharesEventNew } from '@proton/pass/store/actions';
import type { Notification } from '@proton/pass/store/actions/enhancers/notification';
import { selectItem, selectOrganizationGroups, selectShare } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, Maybe } from '@proton/pass/types';
import { type MaybeNull, type Share, ShareType } from '@proton/pass/types';
import type { Group } from '@proton/shared/lib/interfaces';

function* notificationForNewShare(share: Share, onNotification: (notification: Notification) => void) {
    // No notification except for group shares
    if (!isGroupShare(share)) {
        return;
    }

    const groups: MaybeNull<Group[]> = yield select(selectOrganizationGroups);
    const groupName = groups?.find((group) => group.ID === share.groupId)?.Name;
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

    if (!share) {
        return;
    }

    if (!isGroupShare(share)) {
        return onNotification({
            type: 'info',
            text: isVaultShare(share)
                ? c('Info').t`Vault "${share.content.name}" was removed.`
                : c('Info').t`An item previously shared with you was removed.`,
        });
    }

    const groups: MaybeNull<Group[]> = yield select(selectOrganizationGroups);
    const groupName = groups?.find((group) => group.ID === share.groupId)?.Name;
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
    { payload: { shareId } }: ReturnType<typeof shareEventDelete>
) {
    yield notificationForDeletedShare(shareId, onNotification);
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(sharesEventNew.match, notificationForNewSharesWorker, options);
    yield takeEvery(shareEventDelete.match, notificationForDeletedSharesWorker, options);
}
