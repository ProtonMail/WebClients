import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { decodeItemContent, protobufToItem } from '@proton/pass/lib/items/item-proto.transformer';
import { obfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type {
    ItemRevision,
    PublicLinkCreateRequest,
    SecureLink,
    SecureLinkItem,
    SecureLinkOptions,
    SecureLinkQuery,
} from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { buildSecureLink } from './secure-links.utils';

export const createSecureLink = async (
    { shareId, itemId, revision }: ItemRevision,
    options: SecureLinkOptions
): Promise<SecureLink> => {
    const latestItemKey = (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/key/latest`,
            method: 'get',
        })
    ).Key!;

    const linkData = await PassCrypto.createSecureLink({ shareId, latestItemKey });
    const { encryptedItemKey, encryptedLinkKey, secureLinkKey } = linkData;

    const data: PublicLinkCreateRequest = {
        Revision: revision,
        EncryptedItemKey: uint8ArrayToBase64String(encryptedItemKey),
        EncryptedLinkKey: uint8ArrayToBase64String(encryptedLinkKey),
        ExpirationTime: options.expirationTime,
        LinkKeyShareKeyRotation: latestItemKey.KeyRotation,
    };

    if (options.maxReadCount !== null) data.MaxReadCount = options.maxReadCount;

    const { PublicLink } = await api({
        url: `pass/v1/share/${shareId}/item/${itemId}/public_link`,
        method: 'post',
        data,
    });

    if (!PublicLink) throw new Error();

    return {
        shareId,
        itemId,
        secureLink: buildSecureLink(PublicLink.Url!, secureLinkKey),
        active: true,
        expirationDate: PublicLink.ExpirationTime!,
        readCount: 0,
        maxReadCount: options.maxReadCount!,
        linkId: PublicLink.PublicLinkID!,
    };
};

export const openSecureLink = async ({ token, linkKey }: SecureLinkQuery): Promise<SecureLinkItem> => {
    try {
        const { PublicLinkContent } = await api({ url: `pass/v1/public_link/content/${token}`, method: 'get' });
        const decryptedContents = await PassCrypto.openSecureLink({ linkKey, publicLinkContent: PublicLinkContent! });
        const item = obfuscateItem(protobufToItem(decodeItemContent(decryptedContents)));
        const expirationDate = PublicLinkContent?.ExpirationTime!;

        return { item, expirationDate };
    } catch (err) {
        logger.error(`[SecureLink] there was an error opening secure link [${token}]`, err);
        throw err;
    }
};

export const getSecureLinks = async (): Promise<SecureLink[]> => {
    const { PublicLinks } = await api({ url: 'pass/v1/public_link', method: 'get' });

    if (!PublicLinks) return [];

    return Promise.all(
        PublicLinks.map(async (secureLink) => {
            const linkKey = await PassCrypto.openLinkKey({
                encryptedLinkKey: secureLink.EncryptedLinkKey!,
                linkKeyShareKeyRotation: secureLink.LinkKeyShareKeyRotation!,
                shareId: secureLink.ShareID!,
            });

            return {
                active: secureLink.Active,
                linkId: secureLink.LinkID,
                expirationDate: secureLink.ExpirationTime!,
                readCount: secureLink.ReadCount ?? 0,
                maxReadCount: secureLink.MaxReadCount ?? null,
                shareId: secureLink.ShareID!,
                itemId: secureLink.ItemID!,
                secureLink: buildSecureLink(secureLink.LinkURL!, linkKey),
            };
        })
    );
};

export const removeSecureLink = async (linkId: string): Promise<string> => {
    await api({ url: `pass/v1/public_link/${linkId}`, method: 'delete' });
    return linkId;
};

export const removeInactiveSecureLinks = () => api({ url: 'pass/v1/public_link/inactive', method: 'delete' });
