import { c } from 'ttag';
import { OpenPGPKey, SessionKey, decryptPrivateKey as pmcryptoDecryptPrivateKey } from 'pmcrypto';

import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { queryFileRevisionThumbnail } from '@proton/shared/lib/api/drive/files';
import { queryGetLink } from '@proton/shared/lib/api/drive/link';
import { DriveFileRevisionThumbnailResult } from '@proton/shared/lib/interfaces/drive/file';
import { LinkMetaResult } from '@proton/shared/lib/interfaces/drive/link';
import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import { decryptPassphrase, getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { useDebouncedFunction } from '../utils';
import { useDebouncedRequest, linkMetaToEncryptedLink } from '../api';
import { useDriveCrypto } from '../crypto';
import { useShare } from '../shares';
import useLinksKeys from './useLinksKeys';
import useLinksState from './useLinksState';
import { decryptExtendedAttributes } from './extendedAttributes';
import { EncryptedLink, DecryptedLink } from './interface';
import { isDecryptedLinkSame } from './link';

export default function useLink() {
    const linksKeys = useLinksKeys();
    const linksState = useLinksState();
    const { getVerificationKey } = useDriveCrypto();
    const { getSharePrivateKey } = useShare();

    const debouncedRequest = useDebouncedRequest();
    const fetchLink = async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<EncryptedLink> => {
        const { Link } = await debouncedRequest<LinkMetaResult>(queryGetLink(shareId, linkId), abortSignal);
        return linkMetaToEncryptedLink(Link);
    };

    return useLinkInner(
        fetchLink,
        linksKeys,
        linksState,
        getVerificationKey,
        getSharePrivateKey,
        pmcryptoDecryptPrivateKey
    );
}

export function useLinkInner(
    fetchLink: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<EncryptedLink>,
    linksKeys: Pick<
        ReturnType<typeof useLinksKeys>,
        | 'getPassphrase'
        | 'setPassphrase'
        | 'getPassphraseSessionKey'
        | 'setPassphraseSessionKey'
        | 'getPrivateKey'
        | 'setPrivateKey'
        | 'getSessionKey'
        | 'setSessionKey'
        | 'getHashKey'
        | 'setHashKey'
    >,
    linksState: Pick<ReturnType<typeof useLinksState>, 'getLink' | 'setLinks' | 'setCachedThumbnail'>,
    getVerificationKey: ReturnType<typeof useDriveCrypto>['getVerificationKey'],
    getSharePrivateKey: ReturnType<typeof useShare>['getSharePrivateKey'],
    decryptPrivateKey: typeof pmcryptoDecryptPrivateKey
) {
    const debouncedFunction = useDebouncedFunction();
    const debouncedRequest = useDebouncedRequest();

    /**
     * debouncedFunctionDecorator wraps original callback with debouncedFunction
     * to ensure that if even two or more calls with the same parameters are
     * executed only once. E.g., to not decrypt the same link keys twice.
     */
    const debouncedFunctionDecorator = <T>(
        cacheKey: string,
        callback: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<T>
    ): ((abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<T>) => {
        const wrapper = async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<T> => {
            return debouncedFunction(
                async (abortSignal: AbortSignal) => {
                    return callback(abortSignal, shareId, linkId);
                },
                [cacheKey, shareId, linkId],
                abortSignal
            );
        };
        return wrapper;
    };

    const getEncryptedLink = debouncedFunctionDecorator(
        'getEncryptedLink',
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<EncryptedLink> => {
            const cachedLink = linksState.getLink(shareId, linkId);
            if (cachedLink) {
                return cachedLink.encrypted;
            }

            const link = await fetchLink(abortSignal, shareId, linkId);
            linksState.setLinks(shareId, [{ encrypted: link }]);
            return link;
        }
    );

    /**
     * getLinkPassphraseAndSessionKey returns the passphrase with session key
     * used for locking the private key.
     */
    const getLinkPassphraseAndSessionKey = debouncedFunctionDecorator(
        'getLinkPassphraseAndSessionKey',
        async (
            abortSignal: AbortSignal,
            shareId: string,
            linkId: string
        ): Promise<{ passphrase: string; passphraseSessionKey: SessionKey }> => {
            const passphrase = linksKeys.getPassphrase(shareId, linkId);
            const sessionKey = linksKeys.getPassphraseSessionKey(shareId, linkId);
            if (passphrase && sessionKey) {
                return { passphrase, passphraseSessionKey: sessionKey };
            }

            const encryptedLink = await getEncryptedLink(abortSignal, shareId, linkId);
            const parentPrivateKeyPromise = encryptedLink.parentLinkId
                ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
                  getLinkPrivateKey(abortSignal, shareId, encryptedLink.parentLinkId)
                : getSharePrivateKey(abortSignal, shareId);
            const [parentPrivateKey, addressPublicKey] = await Promise.all([
                parentPrivateKeyPromise,
                getVerificationKey(encryptedLink.signatureAddress),
            ]);
            const { decryptedPassphrase, sessionKey: passphraseSessionKey } = await decryptPassphrase({
                armoredPassphrase: encryptedLink.nodePassphrase,
                armoredSignature: encryptedLink.nodePassphraseSignature,
                privateKeys: [parentPrivateKey],
                publicKeys: addressPublicKey,
            });

            linksKeys.setPassphrase(shareId, linkId, decryptedPassphrase);
            linksKeys.setPassphraseSessionKey(shareId, linkId, passphraseSessionKey);
            return {
                passphrase: decryptedPassphrase,
                passphraseSessionKey,
            };
        }
    );

    /**
     * getLinkPrivateKey returns the private key used for link meta data encryption.
     */
    const getLinkPrivateKey = debouncedFunctionDecorator(
        'getLinkPrivateKey',
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<OpenPGPKey> => {
            let privateKey = linksKeys.getPrivateKey(shareId, linkId);
            if (privateKey) {
                return privateKey;
            }

            const encryptedLink = await getEncryptedLink(abortSignal, shareId, linkId);
            const { passphrase } = await getLinkPassphraseAndSessionKey(abortSignal, shareId, linkId);
            privateKey = await decryptPrivateKey(encryptedLink.nodeKey, passphrase);

            linksKeys.setPrivateKey(shareId, linkId, privateKey);
            return privateKey;
        }
    );

    /**
     * getLinkSessionKey returns the session key used for block encryption.
     */
    const getLinkSessionKey = debouncedFunctionDecorator(
        'getLinkSessionKey',
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<SessionKey> => {
            let sessionKey = linksKeys.getSessionKey(shareId, linkId);
            if (sessionKey) {
                return sessionKey;
            }

            const encryptedLink = await getEncryptedLink(abortSignal, shareId, linkId);
            if (!encryptedLink.contentKeyPacket) {
                // This is dev error, should not happen in the wild.
                throw new Error('Content key is available only in file context');
            }

            const privateKey = await getLinkPrivateKey(abortSignal, shareId, linkId);
            const blockKeys = base64StringToUint8Array(encryptedLink.contentKeyPacket);
            sessionKey = await getDecryptedSessionKey({
                data: blockKeys,
                privateKeys: privateKey,
            });

            linksKeys.setSessionKey(shareId, linkId, sessionKey);
            return sessionKey;
        }
    );

    /**
     * getLinkHashKey returns the hash key used for checking name collisions.
     */
    const getLinkHashKey = debouncedFunctionDecorator(
        'getLinkHashKey',
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<string> => {
            let hashKey = linksKeys.getHashKey(shareId, linkId);
            if (hashKey) {
                return hashKey;
            }

            const encryptedLink = await getEncryptedLink(abortSignal, shareId, linkId);
            if (!encryptedLink.nodeHashKey) {
                // This is dev error, should not happen in the wild.
                throw new Error('Hash key is available only in folder context');
            }

            const privateKey = await getLinkPrivateKey(abortSignal, shareId, linkId);
            hashKey = await decryptUnsigned({
                armoredMessage: encryptedLink.nodeHashKey,
                privateKey,
            });

            linksKeys.setHashKey(shareId, linkId, hashKey);
            return hashKey;
        }
    );

    /**
     * decryptLink decrypts provided `encryptedLink`. The result is not stored
     * anywhere, only returned back.
     */
    const decryptLink = async (
        abortSignal: AbortSignal,
        shareId: string,
        encryptedLink: EncryptedLink
    ): Promise<DecryptedLink> => {
        return debouncedFunction(
            async (abortSignal: AbortSignal): Promise<DecryptedLink> => {
                const parentPrivateKey = encryptedLink.parentLinkId
                    ? await getLinkPrivateKey(abortSignal, shareId, encryptedLink.parentLinkId)
                    : await getSharePrivateKey(abortSignal, shareId);

                const namePromise = !encryptedLink.parentLinkId
                    ? c('Title').t`My files`
                    : decryptUnsigned({ armoredMessage: encryptedLink.name, privateKey: parentPrivateKey });
                const fileModifyTimePromise = !encryptedLink.xAttr
                    ? encryptedLink.metaDataModifyTime
                    : getLinkPrivateKey(abortSignal, shareId, encryptedLink.linkId)
                          .then((privateKey) => decryptExtendedAttributes(encryptedLink.xAttr, privateKey))
                          .then((xattr) => xattr.Common.ModificationTime || encryptedLink.metaDataModifyTime);

                const [name, fileModifyTime] = await Promise.all([namePromise, fileModifyTimePromise]);

                return {
                    ...encryptedLink,
                    encryptedName: encryptedLink.name,
                    name: name,
                    fileModifyTime: fileModifyTime,
                };
            },
            ['decryptLink', shareId, encryptedLink.linkId],
            abortSignal
        );
    };

    /**
     * getLInk provides decrypted link. If the cached link is available, it is
     * returned right away. In other cases it might first fetch link from API,
     * or just decrypt the encrypted cached one. If the decrypted link is stale
     * (that means new version of encrypted link was fetched but not decrypted
     * yet), it is first re-decrypted.
     */
    const getLink = debouncedFunctionDecorator(
        'getLink',
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<DecryptedLink> => {
            const cachedLink = linksState.getLink(shareId, linkId);
            if (cachedLink && cachedLink.decrypted && !cachedLink.decrypted.isStale) {
                return cachedLink.decrypted;
            }

            // Do not use getEncryptedLink - that adds it to cache right away.
            // Lets optimise it by updating store with both versions in one go.
            const encrypted = cachedLink?.encrypted
                ? cachedLink?.encrypted
                : await fetchLink(abortSignal, shareId, linkId);
            const decrypted = await decryptLink(abortSignal, shareId, encrypted);

            linksState.setLinks(shareId, [{ encrypted, decrypted }]);
            return decrypted;
        }
    );

    /**
     * loadFreshLink always fetches the fresh link meta data from API, but
     * the decryption is done only when its needed. Anyway, this should be
     * used only when really needed, for example, if we need to make sure if
     * the link doesn't have any shared link already before creating new one.
     */
    const loadFreshLink = async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<DecryptedLink> => {
        const cachedLink = linksState.getLink(shareId, linkId);
        const encryptedLink = await fetchLink(abortSignal, shareId, linkId);
        const decryptedLink =
            cachedLink && isDecryptedLinkSame(cachedLink.encrypted, encryptedLink)
                ? undefined
                : await decryptLink(abortSignal, shareId, encryptedLink);

        linksState.setLinks(shareId, [{ encrypted: encryptedLink, decrypted: decryptedLink }]);
        return linksState.getLink(shareId, linkId)?.decrypted as DecryptedLink;
    };

    /**
     * loadLinkThumbnail gets thumbnail URL either from cached link or fetches
     * it from API, then downloads the thumbnail block and decrypts it using
     * `downloadCallback`, and finally creates local URL to it which is set to
     * the cached link.
     */
    const loadLinkThumbnail = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        downloadCallback: (downloadUrl: string, downloadToken: string) => Promise<Uint8Array[]>
    ): Promise<string | undefined> => {
        const link = await getLink(abortSignal, shareId, linkId);
        if (link.cachedThumbnailUrl || !link.hasThumbnail || !link.activeRevision) {
            return link.cachedThumbnailUrl;
        }

        let downloadUrl = link.activeRevision.thumbnail?.bareUrl;
        let downloadToken = link.activeRevision.thumbnail?.token;
        if (!downloadUrl || !downloadToken) {
            const res = (await debouncedRequest(
                queryFileRevisionThumbnail(shareId, linkId, link.activeRevision.id)
            )) as DriveFileRevisionThumbnailResult;
            downloadUrl = res.ThumbnailBareURL;
            downloadToken = res.ThumbnailToken;
        }

        if (!downloadUrl || !downloadToken) {
            return;
        }

        const data = await downloadCallback(downloadUrl, downloadToken);
        const url = URL.createObjectURL(new Blob(data, { type: 'image/jpeg' }));

        linksState.setCachedThumbnail(shareId, linkId, url);
        return url;
    };

    return {
        getLinkPassphraseAndSessionKey,
        getLinkPrivateKey,
        getLinkSessionKey,
        getLinkHashKey,
        decryptLink,
        getLink,
        loadFreshLink,
        loadLinkThumbnail,
    };
}
