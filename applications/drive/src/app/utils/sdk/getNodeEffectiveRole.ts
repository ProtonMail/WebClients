import {
    MemberRole,
    type NodeEntity,
    type DegradedNode,
    NodeType,
    type ProtonDriveClient,
    ProtonDrivePhotosClient,
} from '@proton/drive';

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
        const parentNode = getNodeEntity(parent).node;
        role = await getNodeEffectiveRole(parentNode, drive, role);
    }

    if (node.type === NodeType.Photo && drive instanceof ProtonDrivePhotosClient) {
        const highestAlbumRole = await getHighestAlbumRole(node, drive);
        role = getHigherRole(highestAlbumRole, role);
    }

    if (role === MemberRole.Inherited) {
        sendErrorReport(
            new EnrichedError('Node has Inherited role and no parent', {
                tags: { component: 'drive-sdk' },
                extra: { uid: node.uid },
            })
        );
        return MemberRole.Viewer;
    }

    return role;
}

async function getHighestAlbumRole(node: NodeEntity | DegradedNode, drive: ProtonDrivePhotosClient): Promise<MemberRole> {
    let role = MemberRole.Inherited;

    const maybeNode = await drive.getNode(node.uid);
    const nodeEntity = maybeNode.ok ? maybeNode.value : maybeNode.error;
    const albumsUids = (nodeEntity.photo?.albums || []).map((album) => album.nodeUid);

    for (const albumUid of albumsUids) {
        const album = await drive.getNode(albumUid);
        const albumNodeEntity = getNodeEntity(album).node;
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
