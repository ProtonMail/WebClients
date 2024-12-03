/**
 * A unique node identifier pair.
 */
export type NodeMeta = {
    volumeId: string;
    linkId: string;
};

/**
 * A unique node identifier pair, for a public shared node.
 */
export type PublicNodeMeta = {
    token: string;
    linkId: string;
};

/**
 * A PublicNodeMeta with an additional resolved volumeId.
 */
export type PublicNodeMetaWithResolvedVolumeID = PublicNodeMeta & {
    volumeId: string;
};

export function isPublicNodeMeta(meta: NodeMeta | PublicNodeMeta): meta is PublicNodeMeta {
    return 'token' in meta;
}

export function isPrivateNodeMeta(meta: NodeMeta | PublicNodeMeta): meta is NodeMeta {
    return 'volumeId' in meta;
}

export type LegacyNodeMeta = {
    shareId: string;
    volumeId: string;
    linkId: string;
};

export function areNodeMetasEqual(a: NodeMeta | PublicNodeMeta, b: NodeMeta | PublicNodeMeta): boolean {
    if (isPublicNodeMeta(a) && !isPublicNodeMeta(b)) {
        return false;
    }
    if (isPublicNodeMeta(b) && !isPublicNodeMeta(a)) {
        return false;
    }
    if (isPublicNodeMeta(a) && isPublicNodeMeta(b)) {
        return a.token === b.token && a.linkId === b.linkId;
    }

    if (isPublicNodeMeta(a) || isPublicNodeMeta(b)) {
        throw new Error('Unhandled public node meta comparison');
    }

    return a.volumeId === b.volumeId && a.linkId === b.linkId;
}
