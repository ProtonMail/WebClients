import { c } from 'ttag';

import type { MaybeBookmark, MaybeNode } from '@proton/drive';

export function getNodeName(node: MaybeNode): string {
    if (node.ok) {
        return node.value.name;
    }
    const maybeName = node.error.name;
    if (maybeName.ok) {
        return maybeName.value;
    }
    if (maybeName.error instanceof Error) {
        return c('Error').t`⚠️ Undecryptable name`;
    }
    // Invalid name can still be used to display the node.
    return maybeName.error.name;
}

export function getBookmarkNodeName(bookmark: MaybeBookmark): string {
    if (bookmark.ok) {
        return bookmark.value.node.name;
    }
    const maybeName = bookmark.error.node.name;
    if (maybeName.ok) {
        return maybeName.value;
    }
    if (maybeName.error instanceof Error) {
        return c('Error').t`⚠️ Undecryptable name`;
    }
    // Invalid name can still be used to display the node.
    return maybeName.error.name;
}
