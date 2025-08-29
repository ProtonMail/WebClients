import { type MaybeNode, MemberRole } from '@proton/drive';

export function isOwnFile(node: MaybeNode): boolean {
    const memberRole = node.ok ? node.value.directRole : node.error.directRole;
    return memberRole === MemberRole.Admin;
}
