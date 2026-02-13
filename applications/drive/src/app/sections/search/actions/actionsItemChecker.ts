import { MemberRole } from '@proton/drive';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { getOpenInDocsInfo } from '../../../utils/docs/openInDocs';
import type { SearchResultItemUI } from '../store';

interface BaseSearchItemChecker {
    canEdit: boolean;
    canDownload: boolean;
    canDelete: boolean;
    hasAtLeastOneSelectedItem: boolean;
}

interface BaseSingleItemChecker extends BaseSearchItemChecker {
    canPreview: boolean;
    canRename: true;
    canShowDetails: true;
    firstItemUid: string;
}

interface SingleItemWithDocsChecker extends BaseSingleItemChecker {
    canOpenInDocs: true;
    openInDocsInfo: OpenInDocsType;
}

interface SingleItemWithoutDocsChecker extends BaseSingleItemChecker {
    canOpenInDocs: false;
    openInDocsInfo?: undefined;
}

interface MultiItemChecker extends BaseSearchItemChecker {
    canPreview: false;
    canRename: false;
    canShowDetails: false;
    firstItemUid?: undefined;
    canOpenInDocs: false;
    openInDocsInfo?: undefined;
}

export type SearchItemChecker = SingleItemWithDocsChecker | SingleItemWithoutDocsChecker | MultiItemChecker;

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

export const createActionsItemChecker = (items: SearchResultItemUI[]): SearchItemChecker => {
    const firstItem = items.at(0);
    const hasAtLeastOneSelectedItem = items.length > 0;

    const canEdit = items.every((item) => item.role === MemberRole.Editor || item.role === MemberRole.Admin);
    const canDownload = hasAtLeastOneSelectedItem;
    const canDelete = hasAtLeastOneSelectedItem;

    if (items.length === 1 && firstItem) {
        const hasPreviewAvailable = !!firstItem.mediaType && isPreviewAvailable(firstItem.mediaType, firstItem.size);

        const openInDocsInfo = firstItem.mediaType ? getOpenInDocsInfo(firstItem.mediaType) : undefined;
        const openableDocsResult = getOpenableDocsInfo(openInDocsInfo, canEdit);

        const base = {
            canEdit,
            canDownload,
            canDelete,
            canPreview: hasPreviewAvailable,
            canRename: true as const,
            canShowDetails: true as const,
            firstItemUid: firstItem.nodeUid,
            hasAtLeastOneSelectedItem,
        };

        if (openableDocsResult.ok) {
            return { ...base, canOpenInDocs: true as const, openInDocsInfo: openableDocsResult.value };
        }

        return { ...base, canOpenInDocs: false as const };
    }

    return {
        canEdit,
        canDownload,
        canDelete,
        canPreview: false as const,
        canRename: false as const,
        canShowDetails: false as const,
        canOpenInDocs: false as const,
        hasAtLeastOneSelectedItem,
    };
};
