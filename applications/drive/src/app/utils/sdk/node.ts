import type { MaybeMissingNode, MaybeNode } from '@proton/drive/index';

export const isMissingNode = (
    maybeMissingNode: MaybeMissingNode
): maybeMissingNode is Exclude<MaybeMissingNode, MaybeNode> => {
    return maybeMissingNode.ok === false && maybeMissingNode.error && 'missingUid' in maybeMissingNode.error;
};

export const getMissingUid = (maybeMissingNode: MaybeMissingNode): string => {
    if (maybeMissingNode.ok === false && 'missingUid' in maybeMissingNode.error) {
        return maybeMissingNode.error.missingUid;
    }
    return 'missing-uid';
};
