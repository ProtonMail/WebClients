import type { MaybeMissingNode, MissingNode } from '@protontech/drive-sdk';

export const isMissingNode = (maybeMissingNode: MaybeMissingNode): maybeMissingNode is MissingNode => {
    return 'missingUid' in maybeMissingNode;
};

export const getMissingUid = (maybeMissingNode: MaybeMissingNode): string => {
    if ('missingUid' in maybeMissingNode) {
        return maybeMissingNode.missingUid;
    }
    return 'missing-uid';
};
