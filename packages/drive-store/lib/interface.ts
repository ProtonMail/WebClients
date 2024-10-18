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

export type LegacyNodeMeta = {
    shareId: string;
    volumeId: string;
    linkId: string;
};

export function areNodeMetasEqual(a: NodeMeta, b: NodeMeta): boolean {
    return a.volumeId === b.volumeId && a.linkId === b.linkId;
}
