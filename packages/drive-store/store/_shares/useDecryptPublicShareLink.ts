import { CryptoProxy } from '@proton/crypto/lib';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import type { SharedURLInfo } from '@proton/shared/lib/interfaces/drive/sharing';
import { computeKeyPassword } from '@proton/srp/lib';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { type DecryptedLinkWithShareInfo, useLink } from './../_links';
import useLinksState from './../_links/useLinksState';
import { ShareState, ShareType } from './interface';
import useSharesKeys from './useSharesKeys';
import useSharesState from './useSharesState';

export const useDecryptPublicShareLink = () => {
    const { setShares } = useSharesState();
    const sharesKeys = useSharesKeys();
    const { setLinks } = useLinksState();
    const { decryptLink } = useLink();

    const decryptPublicShareLink = async (
        abortSignal: AbortSignal,
        {
            urlPassword,
            token,
            shareUrlInfo,
            publicPage = true,
            additionnalDecryptedLinkInfo,
        }: {
            urlPassword: string;
            token: string;
            shareUrlInfo: SharedURLInfo;
            publicPage?: boolean;
            additionnalDecryptedLinkInfo?: Partial<DecryptedLinkWithShareInfo>;
        }
    ) => {
        const computedPassword = await computeKeyPassword(urlPassword, shareUrlInfo.SharePasswordSalt).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to compute key password for public shared item', {
                    tags: {
                        linkId: shareUrlInfo.LinkID,
                    },
                    extra: {
                        e,
                        public: publicPage,
                        crypto: true,
                    },
                })
            )
        );
        const sharePassphrase = await CryptoProxy.decryptMessage({
            armoredMessage: shareUrlInfo.SharePassphrase,
            passwords: [computedPassword],
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to decrypt share passphrase for public shared item', {
                    tags: {
                        linkId: shareUrlInfo.LinkID,
                    },
                    extra: {
                        e,
                        public: publicPage,
                        crypto: true,
                    },
                })
            )
        );

        const sharePrivateKey = await CryptoProxy.importPrivateKey({
            armoredKey: shareUrlInfo.ShareKey,
            passphrase: sharePassphrase.data,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to import share private key for public shared item', {
                    tags: {
                        linkId: shareUrlInfo.LinkID,
                    },
                    extra: {
                        e,
                        public: publicPage,
                        crypto: true,
                    },
                })
            )
        );

        sharesKeys.set(token, sharePrivateKey);

        const encryptedLink = {
            linkId: shareUrlInfo.LinkID,
            parentLinkId: '',
            isFile: shareUrlInfo.LinkType === LinkType.FILE,
            name: shareUrlInfo.Name,
            mimeType: shareUrlInfo.MIMEType,
            size: shareUrlInfo.Size,
            createTime: shareUrlInfo.CreateTime,
            metaDataModifyTime: shareUrlInfo.CreateTime,
            trashed: null,
            hasThumbnail: shareUrlInfo.ThumbnailURLInfo !== undefined,
            isShared: false,
            nodeKey: shareUrlInfo.NodeKey,
            nodePassphrase: shareUrlInfo.NodePassphrase,
            contentKeyPacket: shareUrlInfo.ContentKeyPacket,
            rootShareId: token,
            xAttr: '',
            hash: '',
            volumeId: '',
        };

        // We need to set the share in cache as `getLink` will attempt
        // to fetch the share to determine it's type.
        // This isn't used in the public context.
        const share = {
            shareId: token,
            type: ShareType.standard,
            passphrase: shareUrlInfo.SharePassphrase,
            key: shareUrlInfo.ShareKey,
            passphraseSignature: '',
            creator: '',
            addressId: '',
            rootLinkId: '',
            volumeId: '',
            isLocked: false,
            isDefault: false,
            isVolumeSoftDeleted: false,
            possibleKeyPackets: [],
            state: ShareState.active,
            memberships: [],
        };
        setShares([share]);

        // We pass the share as in decryptLink, the share will be fetch before the share state provider is updated
        const link = await decryptLink(abortSignal, token, encryptedLink, undefined, share);
        const decryptedLink = { ...link, ...additionnalDecryptedLinkInfo };
        setLinks(token, [
            {
                encrypted: encryptedLink,
                decrypted: decryptedLink,
            },
        ]);

        return decryptedLink;
    };

    return { decryptPublicShareLink };
};
