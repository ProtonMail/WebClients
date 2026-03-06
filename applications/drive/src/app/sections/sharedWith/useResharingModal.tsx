import { MemberRole } from '@proton/drive';

import { useFlagsDriveSharingAdminPermissions } from '../../flags/useFlagsDriveSharingAdminPermissions';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';
import { type DirectShareItem, ItemType, type SharedWithMeItem } from './types';

export function useResharingModal(selectedBrowserItems: SharedWithMeItem[]) {
    const { sharingModal, showSharingModal } = useSharingModal();

    const adminRoleEnabled = useFlagsDriveSharingAdminPermissions();

    const itemWithAdmin = getSingleShareWithAdminRole(selectedBrowserItems);
    const canShareItem = adminRoleEnabled && itemWithAdmin;

    function showResharingModal() {
        if (!itemWithAdmin) {
            return;
        }
        showSharingModal({
            nodeUid: itemWithAdmin.nodeUid,
            isResharing: true,
        });
    }

    return { sharingModal, showSharingModal: canShareItem ? showResharingModal : undefined };
}

export function getSingleShareWithAdminRole(selectedBrowserItems: SharedWithMeItem[]): DirectShareItem | undefined {
    if (selectedBrowserItems.length !== 1) {
        return;
    }

    if (selectedBrowserItems[0].itemType !== ItemType.DIRECT_SHARE) {
        return;
    }

    const sharedItem = selectedBrowserItems[0];
    if (sharedItem.role === MemberRole.Admin) {
        return sharedItem;
    }
}
