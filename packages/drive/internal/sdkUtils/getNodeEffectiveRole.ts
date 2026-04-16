import {
    type DegradedNode,
    MemberRole,
    type NodeEntity,
    NodeType,
    type ProtonDriveClient,
} from '@protontech/drive-sdk';
import { ProtonDrivePhotosClient } from '@protontech/drive-sdk/dist/protonDrivePhotosClient';

import { handleDriveError } from '../handleDriveError';

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
    node: NodeEntity | DegradedNode,
    drive: Drive,
    role: MemberRole = MemberRole.Inherited
): Promise<EffectiveRole> {
    role = getHigherRole(node.directRole, role);

    if (role === MemberRole.Admin) {
        return MemberRole.Admin;
    }

    if (node.parentUid) {
        const parent = await drive.getNode(node.parentUid);
        const parentNode = parent.ok ? parent.value : parent.error;
        role = await getNodeEffectiveRole(parentNode, drive, role);
    }

    if (node.type === NodeType.Photo && drive instanceof ProtonDrivePhotosClient) {
        const highestAlbumRole = await getHighestAlbumRole(node, drive);
        role = getHigherRole(highestAlbumRole, role);
    }

    if (role === MemberRole.Inherited) {
        handleDriveError(new Error('Node has Inherited role and no parent'), {
            extra: { uid: node.uid },
        });
        return MemberRole.Viewer;
    }

    return role;
}

async function getHighestAlbumRole(
    node: NodeEntity | DegradedNode,
    drive: ProtonDrivePhotosClient
): Promise<MemberRole> {
    let role = MemberRole.Inherited;

    const maybeNode = await drive.getNode(node.uid);
    const nodeEntity = maybeNode.ok ? maybeNode.value : maybeNode.error;
    const albumsUids = (nodeEntity.photo?.albums || []).map((album) => album.nodeUid);

    for (const albumUid of albumsUids) {
        const album = await drive.getNode(albumUid);
        const albumNodeEntity = album.ok ? album.value : album.error;
        role = getHigherRole(albumNodeEntity.directRole, role);

        if (role === MemberRole.Admin) {
            return MemberRole.Admin;
        }
    }

    return role;
}

export function getHigherRole(role1: MemberRole, role2: MemberRole): MemberRole {
    return MemberHierarchy[role1] > MemberHierarchy[role2] ? role1 : role2;
}
