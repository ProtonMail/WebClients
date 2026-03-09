import { MemberRole, NodeType } from '@proton/drive';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { getOpenInDocsInfo } from '../../../../utils/docs/openInDocs';
import type { SearchResultItemUI } from '../store';

type DocsCapability =
    | { canOpenInDocs: true; openInDocsInfo: OpenInDocsType }
    | { canOpenInDocs: false; openInDocsInfo?: undefined };

type ParentCapability =
    | { canGoToParent: true; parentNodeUid: string }
    | { canGoToParent: false; parentNodeUid?: undefined };

type RevisionCapability =
    | { canShowRevisions: true; revisionNodeUid: string }
    | { canShowRevisions: false; revisionNodeUid?: undefined };

type ShareCapability = { canShare: true; firstItemUid: string } | { canShare: false };

interface BaseSearchItemChecker {
    canEdit: boolean;
    canDownload: boolean;
    canDelete: boolean;
    canMove: boolean;
    hasAtLeastOneSelectedItem: boolean;
}

type SingleItemChecker = BaseSearchItemChecker & {
    canPreview: boolean;
    canRename: true;
    canShowDetails: true;
    firstItemUid: string;
} & DocsCapability &
    ParentCapability &
    RevisionCapability &
    ShareCapability;

type MultiItemChecker = BaseSearchItemChecker & {
    canPreview: false;
    canRename: false;
    canShowDetails: false;
    canGoToParent: false;
    parentNodeUid?: undefined;
    canShowRevisions: false;
    revisionNodeUid?: undefined;
    canOpenInDocs: false;
    openInDocsInfo?: undefined;
} & ShareCapability;

export type SearchItemChecker = SingleItemChecker | MultiItemChecker;

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

export const createActionsItemChecker = (
    items: SearchResultItemUI[],
    buttonType: 'contextMenu' | 'toolbar'
): SearchItemChecker => {
    const firstItem = items.at(0);
    const hasAtLeastOneSelectedItem = items.length > 0;

    const canEdit = items.every((item) => item.role === MemberRole.Editor || item.role === MemberRole.Admin);
    const canDownload = hasAtLeastOneSelectedItem;
    const canDelete = hasAtLeastOneSelectedItem;
    const canMove = canEdit && hasAtLeastOneSelectedItem;

    // Single-selection case:
    if (items.length === 1 && firstItem) {
        const hasPreviewAvailable = !!firstItem.mediaType && isPreviewAvailable(firstItem.mediaType, firstItem.size);

        const openInDocsInfo = firstItem.mediaType ? getOpenInDocsInfo(firstItem.mediaType) : undefined;
        const openableDocsResult = getOpenableDocsInfo(openInDocsInfo, canEdit);

        const parentUid = firstItem.parentUid;

        const isAdmin = firstItem.role === MemberRole.Admin;
        const base = {
            canEdit,
            canDownload,
            canDelete,
            canMove,
            canPreview: hasPreviewAvailable,
            canRename: true as const,
            canShowDetails: true as const,
            firstItemUid: firstItem.nodeUid,
            hasAtLeastOneSelectedItem,
        };

        const sharePart: ShareCapability = isAdmin
            ? { canShare: true as const, firstItemUid: firstItem.nodeUid }
            : { canShare: false as const };

        const parentPart: ParentCapability =
            parentUid && buttonType === 'contextMenu' // Only show 'Go to parent' in context menu
                ? { canGoToParent: true as const, parentNodeUid: parentUid }
                : { canGoToParent: false as const };

        const revisionPart: RevisionCapability =
            canEdit && firstItem.type === NodeType.File && buttonType === 'contextMenu'
                ? { canShowRevisions: true as const, revisionNodeUid: firstItem.nodeUid }
                : { canShowRevisions: false as const };

        const docsPart: DocsCapability = openableDocsResult.ok
            ? { canOpenInDocs: true as const, openInDocsInfo: openableDocsResult.value }
            : { canOpenInDocs: false as const };

        return { ...base, ...sharePart, ...parentPart, ...revisionPart, ...docsPart };
    }

    // Multi-selection case:
    return {
        canEdit,
        canDownload,
        canDelete,
        canMove,
        canShare: false as const,
        canGoToParent: false as const,
        canShowRevisions: false as const,
        canPreview: false as const,
        canRename: false as const,
        canShowDetails: false as const,
        canOpenInDocs: false as const,
        hasAtLeastOneSelectedItem,
    };
};
