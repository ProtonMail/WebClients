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

export type LegacyNodeMeta = {
    shareId: string;
    volumeId: string;
    linkId: string;
};
