import type { ProtonDriveClient } from '@proton/drive/index';
import { MemberRole, type NodeEntity } from '@proton/drive/index';

import { getNodeEntity } from './getNodeEntity';

const MemberHierarchy = {
    [MemberRole.Inherited]: 0,
    [MemberRole.Viewer]: 1,
    [MemberRole.Editor]: 2,
    [MemberRole.Admin]: 3,
};

export const getNodeRole = async (
    node: NodeEntity,
    drive: ProtonDriveClient,
    role: MemberRole = MemberRole.Inherited
): Promise<MemberRole> => {
    if (role === MemberRole.Admin || node.directMemberRole === MemberRole.Admin) {
        return MemberRole.Admin;
    }

    if (node.parentUid) {
        const parent = await drive.getNode(node.parentUid);
        const { node: parentNode } = getNodeEntity(parent);
        role = MemberHierarchy[node.directMemberRole] > MemberHierarchy[role] ? node.directMemberRole : role;
        return getNodeRole(parentNode, drive, role);
    } else if (node.directMemberRole === MemberRole.Inherited) {
        throw new Error('Node cannot have inherited role and no parent');
    }

    return role !== MemberRole.Inherited ? role : node.directMemberRole;
};
