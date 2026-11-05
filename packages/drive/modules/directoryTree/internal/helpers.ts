import type { NodeEntity, ProtonDriveClient } from '../../../sdk';
import { MemberRole } from '../../../sdk';
import { getNodeEffectiveRoleFromHierarchy } from '../../nodes';

export const DEVICES_ROOT_ID = 'devices-root';
export const SHARED_WITH_ME_ROOT_ID = 'shared-with-me-root';

export function makeTreeItemId(parentUid: string | null, uid: string) {
    return `${parentUid}___${uid}`;
}

export function getNodeUidFromTreeItemId(treeItemId: string) {
    return treeItemId.split('___').at(-1);
}

export async function findEffectiveRole(drive: ProtonDriveClient, node: NodeEntity) {
    if (node.directRole === MemberRole.Admin) {
        return MemberRole.Admin;
    }

    const ancestors = node.parentUid ? await drive.getNodeHierarchy(node.parentUid) : [];
    return getNodeEffectiveRoleFromHierarchy([...ancestors, node]);
}
