import { useEffect, useState } from 'react';

import { MemberRole, type ProtonDriveClient, getDrive } from '@proton/drive';

import { useFlagsDriveSharingAdminPermissions } from '../../flags/useFlagsDriveSharingAdminPermissions';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';
import { getNodeEffectiveRole } from '../../utils/sdk/getNodeEffectiveRole';
import { type DirectShareItem, ItemType, type SharedWithMeItem } from './types';

export function useResharingModal(selectedBrowserItems: SharedWithMeItem[]) {
    const drive = getDrive();

    const { sharingModal, showSharingModal } = useSharingModal();

    const adminRoleEnabled = useFlagsDriveSharingAdminPermissions();

    const [itemWithAdmin, setItemWithAdmin] = useState<DirectShareItem>();
    useEffect(() => {
        getSingleShareWithAdminRole(selectedBrowserItems, drive).then(setItemWithAdmin).catch(console.error);
    }, [drive, selectedBrowserItems]);
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

export async function getSingleShareWithAdminRole(selectedBrowserItems: SharedWithMeItem[], drive: ProtonDriveClient) {
    if (selectedBrowserItems.length !== 1) {
        return;
    }

    if (selectedBrowserItems[0].itemType !== ItemType.DIRECT_SHARE) {
        return;
    }

    const sharedItem = selectedBrowserItems[0];
    const node = await drive.getNode(sharedItem.nodeUid);
    const nodeInfo = node.ok ? node.value : node.error;
    const role = await getNodeEffectiveRole(nodeInfo, drive);
    if (role === MemberRole.Admin) {
        return sharedItem;
    }
}
