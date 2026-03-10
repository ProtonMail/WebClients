import { MemberRole } from '@proton/drive';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { getOpenInDocsInfo } from '../../../utils/docs/openInDocs';
import { unleashVanillaStore } from '../../../zustand/unleash/unleash.store';
import { NODE_EDIT_EXPIRACY } from '../constants';
import { usePublicAuthStore } from '../usePublicAuth.store';
import type { PublicFolderItem } from '../usePublicFolder.store';

export interface PublicItemChecker {
    hasPreviewAvailable: boolean;
    canEdit: boolean;
    canScanMalware: boolean;
    isSingleSelection: boolean;
    openInDocsInfo: OpenInDocsType | undefined;
}

const isWithinEditWindow = (creationTime: Date | undefined): boolean => {
    if (!creationTime) {
        return false;
    }
    return Date.now() - creationTime.getTime() <= NODE_EDIT_EXPIRACY;
};

const getIsOwnedByUser = (item: PublicFolderItem): boolean => {
    const { addresses, hasUploadedFile } = usePublicAuthStore.getState();
    if (addresses.length > 0) {
        const isOwnedByUser = addresses.some((address) => address.email === item.uploadedBy);
        const isRecent = isWithinEditWindow(item.creationTime);
        return isOwnedByUser && isRecent;
    }
    return hasUploadedFile(item.uid);
};

export const createActionsItemChecker = (items: PublicFolderItem[]): PublicItemChecker => {
    const { publicRole } = usePublicAuthStore.getState();
    const firstItem = items.at(0);
    const isSingleSelection = items.length === 1 && !!firstItem;

    const hasPreviewAvailable = !!firstItem?.mediaType && isPreviewAvailable(firstItem.mediaType, firstItem.size);

    // TODO: Add that back once API is fixed, which means owner of the share will have admin permissions
    // const role = await getNodeEffectiveRole(folderNode, driveClient);
    const canEdit = items.length > 0 && publicRole !== MemberRole.Viewer && items.every(getIsOwnedByUser);
    const openInDocsInfo = firstItem?.mediaType ? getOpenInDocsInfo(firstItem.mediaType) : undefined;

    const scanDisabled = unleashVanillaStore.getState().isEnabled('DriveDownloadScanDisabled');
    return {
        hasPreviewAvailable,
        canEdit,
        canScanMalware: !scanDisabled,
        isSingleSelection,
        // We can't convert docs/sheets on public page
        openInDocsInfo: openInDocsInfo?.isNative ? openInDocsInfo : undefined,
    };
};
