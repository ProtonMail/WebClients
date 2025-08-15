import { ContentFormatVersion, type ItemRevision, ItemState, type SecureLinkItem } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { encodeBase64URL, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

export const buildSecureLink = (url: string, linkKey: Uint8Array<ArrayBuffer>) =>
    `${url}#${encodeBase64URL(uint8ArrayToString(linkKey))}`;

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
    };
};
