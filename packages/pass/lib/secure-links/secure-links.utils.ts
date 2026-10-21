import { ContentFormatVersion } from '../../types/crypto/pass-types';
import { type ItemRevision, ItemState } from '../../types/data/items';
import type { SecureLinkItem } from '../../types/data/items.dto';
import { uniqueId } from '../../utils/string/unique-id';
import { getEpoch } from '../../utils/time/epoch';

export const buildSecureLink = (url: string, linkKey: Uint8Array<ArrayBuffer>) =>
    `${url}#${linkKey.toBase64({ alphabet: 'base64url', omitPadding: true })}`;

/** Transforms a `SecureLinkItem` into a mocked `ItemRevision` for UI
 * consumption. It's used to make SecureLinkItems compatible with components
 * that expect `ItemRevision` objects. Only used for UI rendering purposes */
export const intoSecureLinkItemRevision = ({ item }: SecureLinkItem): ItemRevision => {
    const now = getEpoch();

    return {
        aliasEmail: null,
        contentFormatVersion: ContentFormatVersion.Item,
        createTime: now,
        data: item,
        flags: 0,
        itemId: uniqueId(),
        lastUseTime: null,
        modifyTime: now,
        pinned: false,
        revision: 0,
        revisionTime: now,
        shareId: '',
        state: ItemState.Active,
        shareCount: 0,
        folderId: null,
    };
};
