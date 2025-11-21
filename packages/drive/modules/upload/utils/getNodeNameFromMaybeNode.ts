import type { MaybeNode } from '@protontech/drive-sdk';
import { c } from 'ttag';

export function getNodeNameFromMaybeNode(node: MaybeNode): string {
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
