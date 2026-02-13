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

type Drive = Pick<ProtonDriveClient, 'getNode'>;

// An explicit role, never Inherited
export type EffectiveRole = Exclude<MemberRole, MemberRole.Inherited>;

export const getNodeEffectiveRole = async (
    node: NodeEntity,
    drive: Drive,
    role: MemberRole = MemberRole.Inherited
): Promise<EffectiveRole> => {
    if (role === MemberRole.Admin || node.directRole === MemberRole.Admin) {
        return MemberRole.Admin;
    }

    if (node.parentUid) {
        const parent = await drive.getNode(node.parentUid);
        const { node: parentNode } = getNodeEntity(parent);
        role = MemberHierarchy[node.directRole] > MemberHierarchy[role] ? node.directRole : role;
        return getNodeEffectiveRole(parentNode, drive, role);
    } else if (node.directRole === MemberRole.Inherited) {
        sendErrorReport(
            new EnrichedError('Node has Inherited role and no parent', {
                tags: { component: 'drive-sdk' },
                extra: { uid: node.uid },
            })
        );
        return MemberRole.Viewer;
    }

    return role !== MemberRole.Inherited ? role : node.directRole;
};
