import type { ProtonDriveClient } from '@proton/drive/index';
import { MemberRole, type NodeEntity } from '@proton/drive/index';

import { sendErrorReport } from '../errorHandling';
import { EnrichedError } from '../errorHandling/EnrichedError';
import { getNodeEntity } from './getNodeEntity';

const MemberHierarchy = {
    [MemberRole.Inherited]: 0,
    [MemberRole.Viewer]: 1,
    [MemberRole.Editor]: 2,
    [MemberRole.Admin]: 3,
};

export const getNodeEffectiveRole = async (
    node: NodeEntity,
    drive: ProtonDriveClient,
    role: MemberRole = MemberRole.Inherited
): Promise<MemberRole.Admin | MemberRole.Editor | MemberRole.Viewer> => {
    if (role === MemberRole.Admin || node.directMemberRole === MemberRole.Admin) {
        return MemberRole.Admin;
    }

    if (node.parentUid) {
        const parent = await drive.getNode(node.parentUid);
        const { node: parentNode } = getNodeEntity(parent);
        role = MemberHierarchy[node.directMemberRole] > MemberHierarchy[role] ? node.directMemberRole : role;
        return getNodeEffectiveRole(parentNode, drive, role);
    } else if (node.directMemberRole === MemberRole.Inherited) {
        sendErrorReport(
            new EnrichedError('Node has Inherited role and no parent', {
                tags: { component: 'drive-sdk' },
                extra: { uid: node.uid },
            })
        );
        return MemberRole.Viewer;
    }

    return role !== MemberRole.Inherited ? role : node.directMemberRole;
};
