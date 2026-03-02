import { useModalTwoStatic } from '@proton/components';
import { MemberRole } from '@proton/drive';

import { useFlagsDriveSharingAdminPermissions } from '../../flags/useFlagsDriveSharingAdminPermissions';
import { withHoc } from '../../hooks/withHoc';
import {
    type DirectShareItem,
    ItemType,
    type SharedWithMeListingItemUI,
} from '../../zustand/sections/sharedWithMeListing.store';
import { SharingModalView, type SharingModalViewProps } from './SharingModalView';
import { type UseSharingModalProps, useSharingModalState } from './useSharingModalState';

const SharingModal = withHoc<UseSharingModalProps, SharingModalViewProps>(useSharingModalState, SharingModalView);

export const useSharingModal = () => {
    const [sharingModal, showSharingModal] = useModalTwoStatic(SharingModal);
    return { sharingModal, showSharingModal };
};

export function useResharingModal(selectedBrowserItems: SharedWithMeListingItemUI[]) {
    const [sharingModal, showSharingModal] = useModalTwoStatic(SharingModal);

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

export function getSingleShareWithAdminRole(
    selectedBrowserItems: SharedWithMeListingItemUI[]
): DirectShareItem | undefined {
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
