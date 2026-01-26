import { MemberRole } from '@proton/drive';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { getOpenInDocsInfo } from '../../../utils/docs/openInDocs';
import { NODE_EDIT_EXPIRACY } from '../constants';
import { usePublicAuthStore } from '../usePublicAuth.store';
import type { PublicFolderItem } from '../usePublicFolder.store';

export interface PublicItemChecker {
    hasPreviewAvailable: boolean;
    canEdit: boolean;
    isSingleSelection: boolean;
    openInDocsInfo: OpenInDocsType | undefined;
}

const getOpenableDocsInfo = (
    openInDocsInfo: OpenInDocsType | undefined,
    canEdit: boolean
): { ok: true; value: OpenInDocsType } | { ok: false } => {
    if (!openInDocsInfo) {
        return { ok: false };
    }

    // Native documents can always be opened
    if (openInDocsInfo.isNative) {
        return { ok: true, value: openInDocsInfo };
    }

    // Non-native documents require edit permissions for conversion
    if (canEdit) {
        return { ok: true, value: openInDocsInfo };
    }

    return { ok: false };
};

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

    const openableDocsResult = getOpenableDocsInfo(openInDocsInfo, canEdit);

    return {
        hasPreviewAvailable,
        canEdit,
        isSingleSelection,
        openInDocsInfo: openableDocsResult.ok ? openableDocsResult.value : undefined,
    };
};
