import { MemberRole, type NodeEntity, NodeType, type ProtonDriveClient } from '@protontech/drive-sdk';
import { ProtonDrivePhotosClient } from '@protontech/drive-sdk/dist/protonDrivePhotosClient';

import { EnrichedError, sendErrorReport } from '../../../legacy/errorHandling';

const MemberHierarchy = {
    [MemberRole.Inherited]: 0,
    [MemberRole.Viewer]: 1,
    [MemberRole.Editor]: 2,
    [MemberRole.Admin]: 3,
};

type Drive = Pick<ProtonDriveClient, 'getNode'>;

// An explicit role, never Inherited
export type EffectiveRole = Exclude<MemberRole, MemberRole.Inherited>;

export async function getNodeEffectiveRole(
    node: NodeEntity,
    drive: Drive,
    role: MemberRole = MemberRole.Inherited
): Promise<EffectiveRole> {
    role = getHigherRole(node.directRole, role);

    if (role === MemberRole.Admin) {
        return MemberRole.Admin;
    }

    if (node.parentUid) {
        const parent = await drive.getNode(node.parentUid);
        role = await getNodeEffectiveRole(parent, drive, role);
    }

    if (node.type === NodeType.Photo && drive instanceof ProtonDrivePhotosClient) {
        const highestAlbumRole = await getHighestAlbumRole(node, drive);
        role = getHigherRole(highestAlbumRole, role);
    }

    return toEffectiveRole(role, node.uid);
}

/**
 * Same as `getNodeEffectiveRole`, for a hierarchy already loaded with `getNodeHierarchy`
 * (from the root to the node). It doesn't include roles coming from photo albums.
 */
export function getNodeEffectiveRoleFromHierarchy(hierarchy: NodeEntity[]): EffectiveRole {
    const role = hierarchy.reduce<MemberRole>(
        (highestRole, node) => getHigherRole(node.directRole, highestRole),
        MemberRole.Inherited
    );
    return toEffectiveRole(role, hierarchy[hierarchy.length - 1].uid);
}

function toEffectiveRole(role: MemberRole, nodeUid: string): EffectiveRole {
    if (role === MemberRole.Inherited) {
        sendErrorReport(
            new EnrichedError('Node has Inherited role and no parent', {
                tags: { component: 'drive-sdk' },
                extra: { uid: nodeUid },
            })
        );
        return MemberRole.Viewer;
    }

    return role;
}

async function getHighestAlbumRole(node: NodeEntity, drive: ProtonDrivePhotosClient): Promise<MemberRole> {
    let role = MemberRole.Inherited;

    const nodeEntity = await drive.getNode(node.uid);
    const albumsUids = (nodeEntity.photo?.albums || []).map((album) => album.nodeUid);

    for (const albumUid of albumsUids) {
        const albumNode = await drive.getNode(albumUid);
        role = getHigherRole(albumNode.directRole, role);

        if (role === MemberRole.Admin) {
            return MemberRole.Admin;
        }
    }

    return role;
}

export function getHigherRole(role1: MemberRole, role2: MemberRole): MemberRole {
    return MemberHierarchy[role1] > MemberHierarchy[role2] ? role1 : role2;
}
