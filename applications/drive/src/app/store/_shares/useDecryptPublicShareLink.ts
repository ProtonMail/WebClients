import { CryptoProxy } from '@proton/crypto/lib';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { computeKeyPassword } from '@proton/srp/lib';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useSharesStore } from '../../zustand/share/shares.store';
import { type DecryptedLink, useLink } from './../_links';
import useLinksState from './../_links/useLinksState';
import { ShareState, ShareType, type SharedUrlInfo } from './interface';
import useSharesKeys from './useSharesKeys';

export const useDecryptPublicShareLink = () => {
    const setShares = useSharesStore((state) => state.setShares);
    const sharesKeys = useSharesKeys();
    const { setLinks } = useLinksState();
    const { decryptLink } = useLink();

    const decryptPublicShareLink = async (
        abortSignal: AbortSignal,
        {
            urlPassword,
            token,
            sharedUrlInfo,
            publicPage = true,
            additionnalDecryptedLinkInfo,
        }: {
            urlPassword: string;
            token: string;
            sharedUrlInfo: SharedUrlInfo;
            publicPage?: boolean;
            additionnalDecryptedLinkInfo?: Partial<DecryptedLink>;
        }
    ) => {
        const computedPassword = await computeKeyPassword(urlPassword, sharedUrlInfo.sharePasswordSalt).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to compute key password for public shared item', {
                    tags: {
                        linkId: sharedUrlInfo.linkId,
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
            armoredMessage: sharedUrlInfo.sharePassphrase,
            passwords: [computedPassword],
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to decrypt share passphrase for public shared item', {
                    tags: {
                        linkId: sharedUrlInfo.linkId,
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
            armoredKey: sharedUrlInfo.shareKey,
            passphrase: sharePassphrase.data,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to import share private key for public shared item', {
                    tags: {
                        linkId: sharedUrlInfo.linkId,
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
            linkId: sharedUrlInfo.linkId,
            parentLinkId: '',
            type: sharedUrlInfo.linkType,
            isFile: sharedUrlInfo.linkType === LinkType.FILE,
            name: sharedUrlInfo.name,
            mimeType: sharedUrlInfo.mimeType,
            size: sharedUrlInfo.size,
            createTime: 0,
            metaDataModifyTime: 0,
            trashed: null,
            hasThumbnail: sharedUrlInfo.thumbnailUrlInfo !== undefined,
            nodeKey: sharedUrlInfo.nodeKey,
            nodeHashKey: sharedUrlInfo.nodeHashKey ?? undefined,
            nodePassphrase: sharedUrlInfo.nodePassphrase,
            nodePassphraseSignature: sharedUrlInfo.nodePassphraseSignature,
            signatureEmail: sharedUrlInfo.signatureEmail,
            contentKeyPacket: sharedUrlInfo.contentKeyPacket,
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
            passphrase: sharedUrlInfo.sharePassphrase,
            key: sharedUrlInfo.shareKey,
            passphraseSignature: '',
            creator: '',
            addressId: '',
            rootLinkId: '',
            volumeId: '',
            isLocked: false,
            isDefault: false,
            possibleKeyPackets: [],
            state: ShareState.active,
            memberships: [],
            createTime: 0,
            linkType: sharedUrlInfo.linkType,
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
