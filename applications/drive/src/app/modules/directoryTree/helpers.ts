import type { DegradedNode, NodeEntity, ProtonDriveClient } from '@proton/drive';
import { MemberRole } from '@proton/drive';

export const DEVICES_ROOT_ID = 'devices-root';
export const SHARED_WITH_ME_ROOT_ID = 'shared-with-me-root';

export function makeTreeItemId(parentUid: string | null, uid: string) {
    return `${parentUid}___${uid}`;
}

export function getNodeUidFromTreeItemId(treeItemId: string) {
    return treeItemId.split('___').at(-1);
}

export async function findEffectiveRole(
    drive: ProtonDriveClient,
    node: NodeEntity | DegradedNode,
    previousHighestRole?: MemberRole
) {
    if (node.directRole === MemberRole.Admin) {
        return MemberRole.Admin;
    }

    if (previousHighestRole) {
        const newHighest = getMorePermissiveRole(previousHighestRole, node.directRole);

        if (newHighest === MemberRole.Admin) {
            return MemberRole.Admin;
        }

        // No parent, stop traversing
        if (!node.parentUid) {
            return newHighest;
        }

        const parent = await drive.getNode(node.parentUid);
        return findEffectiveRole(drive, parent.ok ? parent.value : parent.error, newHighest);
    }

    // No previous highest role = current one is the highest
    if (node.parentUid) {
        const parent = await drive.getNode(node.parentUid);
        return findEffectiveRole(drive, parent.ok ? parent.value : parent.error, node.directRole);
    } else {
        // No parent, stop traversing
        return node.directRole;
    }
}

const PERMISSION_LEVELS = {
    [MemberRole.Inherited]: 0,
    [MemberRole.Viewer]: 1,
    [MemberRole.Editor]: 2,
    [MemberRole.Admin]: 3,
};

function getMorePermissiveRole(first: MemberRole, second: MemberRole) {
    if (PERMISSION_LEVELS[first] > PERMISSION_LEVELS[second]) {
        return first;
    } else {
        return second;
    }
}
