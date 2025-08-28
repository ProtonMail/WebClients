import { type MaybeNode } from '@proton/drive';

export function getIsAnonymousUser(node: MaybeNode): boolean {
    const nodeEntity = node.ok ? node.value : node.error;
    return !nodeEntity.keyAuthor.ok && !nodeEntity.keyAuthor.error.claimedAuthor;
}
