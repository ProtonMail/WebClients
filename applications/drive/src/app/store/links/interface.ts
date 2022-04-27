import { VERIFICATION_STATUS } from 'pmcrypto';

/**
 * Link should not be used directly. It is general set of attributes
 * commont for both EncryptedLink and DecryptedLink.
 */
interface Link {
    linkId: string;
    parentLinkId: string;
    isFile: boolean;
    name: string;
    mimeType: string;
    size: number;
    createTime: number;
    // metaDataModifyTime represents time when the meta data of the link were
    // modified on the server, such as renaming the link, moving to different
    // folder and so on. Note that renaming is not cousing the change of modify
    // time in regular file system. The "real" modify is encrypted in XAttr
    // which is then available in fileModifyTime of DecryptedLink.
    metaDataModifyTime: number;
    trashed: number | null;
    // trashedByParent is set only by internal state in case when parent is
    // trashed which needs to trash also all children as well.
    // Child items need to be trashed so they do not pop up anywhere, for
    // example on shared links page, but at the same time childs of trashed
    // folders should not be listed in trash section to match API behaviour.
    // Note there is also other solution: simply delete childs of trashed
    // folder from the cache, as they should not be needed at all. That is
    // correct, but restoring it quickly back (in case of a mistake) would
    // lead to re-download the whole cache again, and there would be need
    // to re-fetch shared links. So better to keep it around.
    trashedByParent?: boolean;
    hasThumbnail: boolean;
    isShared: boolean;
    // Note that shareId is ID of the share, that is pointer of what is shared
    // with someone else. Link can be part of many shares; for example part of
    // user's default share and of shared folder with someone else.
    // Don't use this ID on places where the top/default share should be used.
    // The current share context needs to be always passed explicitely, never
    // used from the link itself.
    shareId?: string;
    shareUrl?: LinkShareUrl;
    activeRevision?: {
        id: string;
        size: number;
        // Address used for signature checks of blocks and xattributes.
        signatureAddress: string;
        // Thumbnail URL is not part of all requests, because that would be
        // too heavy for API. For example, events do not include it.
        thumbnail?: {
            bareUrl: string;
            token: string;
        };
    };
    signatureAddress: string; // Addresss used for key signatures.
    nameSignatureAddress: string; // Address used for name signature.
    // If there is no issue, the value should be undefined.
    signatureIssues?: SignatureIssues;
}

export interface LinkShareUrl {
    id: string;
    token: string;
    isExpired: boolean;
    createTime: number;
    expireTime: number | null;
    // numAccesses is not part of API requests, because that would be too
    // heavy for API. This number needs to be loaded explicitely with route
    // to get info about share URL.
    numAccesses?: number;
}

export type SignatureIssues = {
    // Key represents where the issue originated, e.g., passphrase, hash, name
    // xattributes, block, and so on.
    [day in SignatureIssueLocation]?: VERIFICATION_STATUS;
};

export type SignatureIssueLocation = 'passphrase' | 'hash' | 'name' | 'xattrs' | 'blocks' | 'thumbnail';

export interface EncryptedLink extends Link {
    nodeKey: string;
    nodePassphrase: string;
    nodePassphraseSignature: string;
    nodeHashKey?: string;
    contentKeyPacket?: string;
    xAttr: string;
}

export interface DecryptedLink extends Link {
    // name in DecryptedLink is the decrypted part, but we need to keep also
    // encryptedName for renaming procedure (to generate new sessionKey).
    encryptedName: string;
    // See metaDataModifyTime of Link.
    fileModifyTime: number;
    // isLocked is set to true when file is being manipulated, such as moved
    // to different location. When link is locked, it should not be allowed
    // to do anything else with the link (until the operation is done).
    isLocked?: boolean;
    // isStale is indicating whether link needs to be re-decrypted due to
    // server-side update. By default, we don't want to automatically decrypt
    // everything, also, we don't want to simply remove stale link from cache
    // to not cause GUI blinks. App should re-decrypt link on background next
    // time link should be displayed.
    isStale?: boolean;
    // cachedThumbnailUrl is computed URL to cached image. This is not part
    // of any request and not filled automatically. To get this value, use
    // `loadLinkThumbnail` from `useDrive`.
    cachedThumbnailUrl?: string;
}
