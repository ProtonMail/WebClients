import { c } from 'ttag';
import {
    concatArrays,
    decryptMessage,
    decryptPrivateKey,
    encryptMessage,
    getMessage,
    getSignature,
    OpenPGPKey,
    getMatchingKey,
    VERIFICATION_STATUS,
} from 'pmcrypto';
import { format } from 'date-fns';

import { usePreventLeave, useGlobalLoader, useApi, useEventManager, useNotifications } from 'react-components';

import { getEncryptedSessionKey } from 'proton-shared/lib/calendar/encrypt';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { base64StringToUint8Array, uint8ArrayToBase64String } from 'proton-shared/lib/helpers/encoding';
import { chunk } from 'proton-shared/lib/helpers/array';
import { Address, DecryptedKey } from 'proton-shared/lib/interfaces';
import { dateLocale } from 'proton-shared/lib/i18n';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import runInQueue from 'proton-shared/lib/helpers/runInQueue';
import {
    decryptUnsigned,
    generateNodeKeys,
    generateLookupHash,
    generateDriveBootstrap,
    generateNodeHashKey,
    encryptPassphrase,
    encryptName,
} from 'proton-shared/lib/keys/driveKeys';

import {
    BATCH_REQUEST_SIZE,
    DEFAULT_SORT_PARAMS,
    EVENT_TYPES,
    FOLDER_PAGE_SIZE,
    MAX_THREADS_PER_REQUEST,
} from '../../constants';
import { ShareFlags, ShareMeta, UserShareResult } from '../../interfaces/share';
import { CreatedDriveVolumeResult } from '../../interfaces/volume';
import { isFolderLinkMeta, LinkChildrenResult, LinkMeta, LinkMetaResult, LinkType } from '../../interfaces/link';
import { DriveFileRevisionThumbnailResult } from '../../interfaces/file';
import {
    queryCreateShare,
    queryDeleteShare,
    queryMoveLink,
    queryRenameLink,
    queryShareMeta,
    queryUserShares,
} from '../../api/share';
import { queryDeleteChildrenLinks, queryGetLink } from '../../api/link';
import { queryFileRevisionThumbnail } from '../../api/files';
import { queryCreateFolder, queryFolderChildren } from '../../api/folder';
import { queryCreateDriveVolume, queryRestoreDriveVolume } from '../../api/volume';
import { isPrimaryShare } from '../../utils/share';
import { decryptPassphrase, getDecryptedSessionKey } from '../../utils/drive/driveCrypto';
import { validateLinkName, ValidationError } from '../../utils/validation';
import useDebouncedRequest from '../util/useDebouncedRequest';
import useQueuedFunction from '../util/useQueuedFunction';
import { getSuccessfulSettled, logSettledErrors } from '../../utils/async';
import useDriveCrypto from './useDriveCrypto';
import { LinkKeys, useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import { useDriveEventManager, ShareEvent } from '../../components/DriveEventManager/DriveEventManagerProvider';
import { GLOBAL_FORBIDDEN_CHARACTERS } from '../../utils/link';

const { CREATE, DELETE, UPDATE_METADATA } = EVENT_TYPES;

export interface FetchLinkConfig {
    fetchLinkMeta?: (id: string) => Promise<LinkMeta>;
    preventRerenders?: boolean;
    skipCache?: boolean;
    abortSignal?: AbortSignal;
}

function useDrive() {
    const api = useApi();
    const cache = useDriveCache();
    const queuedFunction = useQueuedFunction();
    const withGlobalLoader = useGlobalLoader({
        text: c('Info').t`Loading folder contents`,
    });
    const { getPrimaryAddressKey, getVerificationKey, decryptSharePassphrase } = useDriveCrypto();
    const debouncedRequest = useDebouncedRequest();
    const { preventLeave } = usePreventLeave();
    const eventManager = useEventManager();
    const { getShareEventManager, createShareEventManager } = useDriveEventManager();
    const { createNotification } = useNotifications();

    const getShareMeta = async (shareId: string) => {
        const cachedMeta = cache.get.shareMeta(shareId);

        if (cachedMeta && 'Passphrase' in cachedMeta) {
            return cachedMeta;
        }

        const Share = await debouncedRequest<ShareMeta>(queryShareMeta(shareId));
        cache.set.shareMeta(Share);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await events.subscribe(shareId);

        if (isPrimaryShare(Share)) {
            cache.setDefaultShare(Share.ShareID);
        }

        return Share;
    };

    const getShareMetaShort = async (shareId: string) => {
        const cachedMeta = cache.get.shareMeta(shareId);

        if (cachedMeta) {
            return cachedMeta;
        }

        return getShareMeta(shareId);
    };

    const createVolume = async () => {
        const { address, privateKey } = await getPrimaryAddressKey();
        const { bootstrap, folderPrivateKey } = await generateDriveBootstrap(privateKey);
        const { NodeHashKey: FolderHashKey } = await generateNodeHashKey(folderPrivateKey.toPublic());

        const { Volume } = await debouncedRequest<CreatedDriveVolumeResult>(
            queryCreateDriveVolume({
                AddressID: address.ID,
                VolumeName: 'MainVolume',
                ShareName: 'MainShare',
                FolderHashKey,
                ...bootstrap,
            })
        );

        // TODO: get share meta from events when BE implements them
        cache.set.emptyShares([
            {
                ShareID: Volume.Share.ID,
                LinkType: LinkType.FOLDER,
                Flags: ShareFlags.PrimaryShare,
            },
        ]);

        return Volume;
    };

    const getUserShares = async (): Promise<[string[], string | undefined]> => {
        const shares = cache.get.shareIds();

        if (shares.length) {
            return [shares, cache.defaultShare];
        }

        const { Shares } = await debouncedRequest<UserShareResult>(queryUserShares());
        const shareIds = Shares.map(({ ShareID }) => ShareID);
        const defaultShare = Shares.filter((share) => !share.Locked).find(isPrimaryShare);
        const lockedShares = Shares.filter((share) => share.Locked && isPrimaryShare(share));

        cache.setLockedShares(lockedShares);
        cache.set.emptyShares(Shares);

        if (defaultShare) {
            cache.setDefaultShare(defaultShare.ShareID);
        }

        return [shareIds, defaultShare?.ShareID];
    };

    const initDrive = async () => {
        const [, defaultShare] = await getUserShares();
        let shareId = defaultShare;

        if (!shareId) {
            const { Share } = await createVolume();
            shareId = Share.ID;
        }

        return getShareMeta(shareId);
    };

    const getShareKeys = async (shareId: string) => {
        const cachedKeys = cache.get.shareKeys(shareId);

        if (cachedKeys) {
            return cachedKeys;
        }

        const meta = await getShareMeta(shareId);
        const { decryptedPassphrase, sessionKey } = await decryptSharePassphrase(meta);

        const privateKey = await decryptPrivateKey(meta.Key, decryptedPassphrase);
        const keys = {
            privateKey,
            sessionKey,
        };
        cache.set.shareKeys(keys, shareId);

        return keys;
    };

    const decryptLink = async (meta: LinkMeta, privateKey: OpenPGPKey): Promise<LinkMeta> => {
        return {
            ...meta,
            EncryptedName: meta.Name,
            Name: await decryptUnsigned({ armoredMessage: meta.Name, privateKey }),
        };
    };

    const getLinkKeys = async (shareId: string, linkId: string, config: FetchLinkConfig = {}): Promise<LinkKeys> => {
        const cachedKeys = cache.get.linkKeys(shareId, linkId);

        if (cachedKeys) {
            return cachedKeys;
        }

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const meta = await getLinkMeta(shareId, linkId, config);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const { decryptedPassphrase, sessionKey: passphraseSessionKey } = await decryptLinkPassphrase(
            shareId,
            meta,
            config
        );
        const privateKey = await decryptPrivateKey(meta.NodeKey, decryptedPassphrase);

        if (isFolderLinkMeta(meta)) {
            const keys = {
                passphraseSessionKey,
                privateKey,
                hashKey: await decryptUnsigned({
                    armoredMessage: meta.FolderProperties.NodeHashKey,
                    privateKey,
                }),
            };
            cache.set.linkKeys(keys, shareId, linkId);
            return keys;
        }

        const blockKeys = base64StringToUint8Array(meta.FileProperties.ContentKeyPacket);
        const sessionKeys = await getDecryptedSessionKey({
            data: blockKeys,
            privateKeys: privateKey,
        });

        const keys = {
            privateKey,
            sessionKeys,
            passphraseSessionKey,
        };
        cache.set.linkKeys(keys, shareId, linkId);
        return keys;
    };

    const getLinkMeta = async (shareId: string, linkId: string, config: FetchLinkConfig = {}): Promise<LinkMeta> => {
        const cachedMeta = cache.get.linkMeta(shareId, linkId);

        if (!config.skipCache && cachedMeta) {
            return cachedMeta;
        }

        const Link = config.fetchLinkMeta
            ? await config.fetchLinkMeta(linkId)
            : (
                  await debouncedRequest<LinkMetaResult>({
                      ...queryGetLink(shareId, linkId),
                      signal: config.abortSignal,
                  })
              ).Link;

        const { privateKey } = Link.ParentLinkID
            ? await getLinkKeys(shareId, Link.ParentLinkID, config)
            : await getShareKeys(shareId);

        const meta = await decryptLink(Link, privateKey);
        cache.set.linkMeta(meta, shareId, { rerender: !config.preventRerenders });

        return meta;
    };

    // loadLinkCachedThumbnailURL populates CachedThumbnailURL to the link meta
    // object if not cached yet, otherwise keeps the cached version.
    const loadLinkCachedThumbnailURL = async (
        shareId: string,
        linkId: string,
        downloadCallback: (downloadUrl: string) => Promise<Uint8Array[]>
    ) => {
        const linkMeta = await getLinkMeta(shareId, linkId);
        if (
            linkMeta.CachedThumbnailURL ||
            linkMeta.ThumbnailIsLoading ||
            linkMeta.FileProperties?.ActiveRevision?.Thumbnail !== 1
        ) {
            return;
        }

        cache.set.linkMeta({ ...linkMeta, ThumbnailIsLoading: true }, shareId, { rerender: false });

        try {
            // Download URL is not part of all requests, because that would be
            // too heavy for API. For example, events do not include it.
            let downloadUrl = linkMeta.FileProperties?.ActiveRevision?.ThumbnailDownloadUrl;
            if (!downloadUrl) {
                const res = (await api(
                    queryFileRevisionThumbnail(shareId, linkId, linkMeta.FileProperties.ActiveRevision.ID)
                )) as DriveFileRevisionThumbnailResult;
                downloadUrl = res.ThumbnailLink;
            }

            const data = await downloadCallback(downloadUrl);
            const url = URL.createObjectURL(new Blob(data, { type: 'image/jpeg' }));
            cache.set.linkMeta({ ...linkMeta, ThumbnailIsLoading: false, CachedThumbnailURL: url }, shareId);
        } catch (e) {
            cache.set.linkMeta({ ...linkMeta, ThumbnailIsLoading: false }, shareId, { rerender: false });
            throw e;
        }
    };

    const decryptLinkPassphrase = async (shareId: string, linkMeta: LinkMeta, config?: FetchLinkConfig) => {
        const [{ privateKey: parentKey }, publicKeys] = await Promise.all([
            linkMeta.ParentLinkID
                ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
                  await getLinkKeys(shareId, linkMeta.ParentLinkID, config)
                : await getShareKeys(shareId),
            getVerificationKey(linkMeta.SignatureAddress),
        ]);

        return decryptPassphrase({
            armoredPassphrase: linkMeta.NodePassphrase,
            armoredSignature: linkMeta.NodePassphraseSignature,
            privateKeys: [parentKey],
            publicKeys,
        });
    };

    const fetchNextFoldersOnlyContents = async (shareId: string, linkId: string) => {
        const listedFolders = cache.get.listedFoldersOnlyLinks(shareId, linkId) || [];

        const PageSize = FOLDER_PAGE_SIZE;
        const Page = Math.floor(listedFolders.length / PageSize);
        const FoldersOnly = 1;

        const { Links } = await debouncedRequest<LinkChildrenResult>(
            queryFolderChildren(shareId, linkId, { Page, PageSize, FoldersOnly })
        );
        const { privateKey } = await getLinkKeys(shareId, linkId);

        const decryptedLinks = await Promise.all(Links.map((link) => decryptLink(link, privateKey)));
        cache.set.foldersOnlyLinkMetas(
            decryptedLinks,
            shareId,
            linkId,
            Links.length < PageSize ? 'complete' : 'incremental'
        );
    };

    const getFoldersOnlyMetas = async (shareId: string, linkId: string, fetchNextPage = false) => {
        const listedFolders = cache.get.listedFoldersOnlyLinks(shareId, linkId) || [];
        const complete = cache.get.foldersOnlyComplete(shareId, linkId);
        if ((!complete && listedFolders.length === 0) || fetchNextPage) {
            await fetchNextFoldersOnlyContents(shareId, linkId);
        }

        const linkMetas = cache.get.foldersOnlyLinkMetas(shareId, linkId) || [];
        return linkMetas;
    };

    const fetchNextFolderContents = async (shareId: string, linkId: string, sortParams = DEFAULT_SORT_PARAMS) => {
        const listedChildren = cache.get.listedChildLinks(shareId, linkId, sortParams) || [];

        const PageSize = FOLDER_PAGE_SIZE;
        const Page = Math.floor(listedChildren.length / PageSize);
        const Sort = sortParams?.sortField;
        const Desc = sortParams?.sortOrder === SORT_DIRECTION.DESC ? 1 : 0;

        const { Links } = await debouncedRequest<LinkChildrenResult>(
            queryFolderChildren(shareId, linkId, { Page, PageSize, Sort, Desc })
        );
        const { privateKey } = await getLinkKeys(shareId, linkId);

        const decryptedLinks = await Promise.all(Links.map((link) => decryptLink(link, privateKey)));
        cache.set.childLinkMetas(
            decryptedLinks,
            shareId,
            linkId,
            Links.length < PageSize ? 'complete' : 'incremental',
            sortParams
        );
    };

    const fetchAllFolderPages = async (shareId: string, linkId: string) => {
        if (!cache.get.childrenComplete(shareId, linkId)) {
            await fetchNextFolderContents(shareId, linkId);
            await fetchAllFolderPages(shareId, linkId);
        }
    };

    const fetchAllFolderPagesWithLoader = async (shareId: string, linkId: string) => {
        if (cache.get.childrenComplete(shareId, linkId)) {
            return;
        }

        if (cache.get.childrenInitialized(shareId, linkId)) {
            await withGlobalLoader(
                (async () => {
                    await fetchNextFolderContents(shareId, linkId);
                    await fetchAllFolderPages(shareId, linkId);
                })()
            );
        } else {
            await Promise.resolve().then(async () => {
                await fetchNextFolderContents(shareId, linkId);
                await fetchAllFolderPagesWithLoader(shareId, linkId);
            });
        }
    };

    const renameLink = async (shareId: string, linkId: string, parentLinkID: string, newName: string) => {
        const error = validateLinkName(newName);

        if (error) {
            throw new ValidationError(error);
        }

        const parentKeys = await getLinkKeys(shareId, parentLinkID);

        if (!('hashKey' in parentKeys)) {
            throw new Error('Missing hash key on folder link');
        }

        const meta = await getLinkMeta(shareId, linkId);
        const [sessionKey, { address, privateKey: addressKey }] = await Promise.all([
            getDecryptedSessionKey({
                data: meta.EncryptedName,
                privateKeys: parentKeys.privateKey,
            }),
            getPrimaryAddressKey(),
        ]);

        const [Hash, { data: encryptedName }] = await Promise.all([
            generateLookupHash(newName, parentKeys.hashKey),
            encryptMessage({
                data: newName,
                sessionKey,
                privateKeys: addressKey,
            }),
        ]);

        await debouncedRequest(
            queryRenameLink(shareId, linkId, {
                Name: encryptedName,
                Hash,
                SignatureAddress: address.Email,
            })
        );
    };

    const createNewFolder = queuedFunction(
        'createNewFolder',
        async (shareId: string, ParentLinkID: string, name: string) => {
            // Name Hash is generated from LC, for case-insensitive duplicate detection
            const error = validateLinkName(name);

            if (error) {
                throw new ValidationError(error);
            }

            const [parentKeys, { privateKey: addressKey, address }] = await Promise.all([
                getLinkKeys(shareId, ParentLinkID),
                getPrimaryAddressKey(),
            ]);

            if (!('hashKey' in parentKeys)) {
                throw new Error('Missing hash key on folder link');
            }

            const [
                Hash,
                { NodeKey, NodePassphrase, privateKey, NodePassphraseSignature },
                encryptedName,
            ] = await Promise.all([
                generateLookupHash(name, parentKeys.hashKey),
                generateNodeKeys(parentKeys.privateKey, addressKey),
                encryptName(name, parentKeys.privateKey.toPublic(), addressKey),
            ]);

            const { NodeHashKey } = await generateNodeHashKey(privateKey.toPublic());

            return debouncedRequest<{ Folder: { ID: string } }>(
                queryCreateFolder(shareId, {
                    Hash,
                    NodeHashKey,
                    Name: encryptedName,
                    NodeKey,
                    NodePassphrase,
                    NodePassphraseSignature,
                    SignatureAddress: address.Email,
                    ParentLinkID,
                })
            );
        },
        5
    );

    const moveLink = async (shareId: string, ParentLinkID: string, linkId: string) => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await events.call(shareId); // Name could have changed while moving
        const [meta, parentKeys, { privateKey: addressKey, address }] = await Promise.all([
            getLinkMeta(shareId, linkId),
            getLinkKeys(shareId, ParentLinkID),
            getPrimaryAddressKey(),
        ]);

        if (!('hashKey' in parentKeys)) {
            throw new Error('Missing hash key on folder link');
        }

        const currentParent = await getLinkKeys(shareId, meta.ParentLinkID);
        const sessionKeyName = await getDecryptedSessionKey({
            data: meta.EncryptedName,
            privateKeys: currentParent.privateKey,
        });

        const [Hash, { NodePassphrase, NodePassphraseSignature }, { data: encryptedName }] = await Promise.all([
            generateLookupHash(meta.Name, parentKeys.hashKey),
            decryptLinkPassphrase(shareId, meta).then(({ decryptedPassphrase, sessionKey }) =>
                encryptPassphrase(parentKeys.privateKey, addressKey, decryptedPassphrase, sessionKey)
            ),
            encryptMessage({
                data: meta.Name,
                sessionKey: sessionKeyName,
                publicKeys: parentKeys.privateKey.toPublic(),
                privateKeys: addressKey,
            }),
        ]);

        const data = {
            Name: encryptedName,
            Hash,
            ParentLinkID,
            NodePassphrase,
            NodePassphraseSignature,
            SignatureAddress: address.Email,
        };

        await debouncedRequest(queryMoveLink(shareId, linkId, data));
        return { LinkID: meta.LinkID, Type: meta.Type, Name: meta.Name };
    };

    const moveLinks = async (shareId: string, parentFolderId: string, linkIds: string[]) => {
        cache.set.linksLocked(true, shareId, linkIds);
        const moved: { LinkID: string; Name: string; Type: LinkType }[] = [];
        const failed: string[] = [];
        const moveQueue = linkIds.map((linkId) => async () => {
            await moveLink(shareId, parentFolderId, linkId)
                .then((result) => {
                    moved.push(result);
                })
                .catch((error) => {
                    if (error.name === 'Error') {
                        failed.push(linkId);
                        console.error(`Failed to move link ${linkId}: ${error}`);
                    }
                });
        });

        try {
            await preventLeave(runInQueue(moveQueue, MAX_THREADS_PER_REQUEST));
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            await events.call(shareId);
            return { moved, failed };
        } finally {
            cache.set.linksLocked(false, shareId, linkIds);
        }
    };

    const decryptLockedSharePassphrase = async (
        oldPrivateKey: OpenPGPKey,
        lockedShareMeta: ShareMeta
    ): Promise<any> => {
        if (!lockedShareMeta.PossibleKeyPackets) {
            return;
        }

        const keyPacketsAsUnit8Array = concatArrays(
            lockedShareMeta.PossibleKeyPackets.map(({ KeyPacket }) => base64StringToUint8Array(KeyPacket))
        );
        const sessionKey = await getDecryptedSessionKey({
            data: await getMessage(keyPacketsAsUnit8Array),
            privateKeys: oldPrivateKey,
        });

        const { data: decryptedPassphrase, verified } = await decryptMessage({
            message: await getMessage(lockedShareMeta.Passphrase),
            signature: await getSignature(lockedShareMeta.PassphraseSignature),
            sessionKeys: sessionKey,
            publicKeys: oldPrivateKey.toPublic(),
        });

        if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
            const error = new Error(c('Error').t`Signature verification failed`);
            error.name = 'SignatureError';
            throw error;
        }

        if (!lockedShareMeta.RootLinkRecoveryPassphrase) {
            return;
        }

        const lockedShareKey = await decryptPrivateKey(lockedShareMeta.Key, decryptedPassphrase);
        const shareSessionKey = await getDecryptedSessionKey({
            data: await getMessage(lockedShareMeta.RootLinkRecoveryPassphrase),
            privateKeys: lockedShareKey,
        });
        const { data: shareDecryptedPassphrase } = await decryptMessage({
            message: await getMessage(lockedShareMeta.RootLinkRecoveryPassphrase),
            sessionKeys: shareSessionKey,
            publicKeys: lockedShareKey.toPublic(),
        });

        return shareDecryptedPassphrase;
    };

    const getSharesReadyToRestore = async (possibleKeys: DecryptedKey[], lockedShareIds: string[]) => {
        if (!possibleKeys.length) {
            return [];
        }
        const privateKeys = possibleKeys.map(({ privateKey }) => privateKey);

        const lockedShareMetaPromises = lockedShareIds.map((shareId) =>
            debouncedRequest<ShareMeta>(queryShareMeta(shareId))
        );
        const lockedShareMetaList = await Promise.all(lockedShareMetaPromises);

        const decryptionPromises = lockedShareMetaList.map(async (meta) => {
            try {
                const signature = await getSignature(meta.PassphraseSignature);
                const matchingPrivateKey = await getMatchingKey(signature, privateKeys);

                if (matchingPrivateKey) {
                    const decryptedPassphrase = await decryptLockedSharePassphrase(matchingPrivateKey, meta);
                    if (decryptedPassphrase) {
                        return { lockedShareMeta: meta, decryptedPassphrase };
                    }
                }
            } catch {
                return undefined;
            }
        });
        return (await Promise.all(decryptionPromises)).filter(isTruthy);
    };

    const restoreVolume = async (
        parentVolumeID: string,
        parentKeys: LinkKeys,
        addressKey: OpenPGPKey,
        address: Address,
        lockedSahareMeta: ShareMeta,
        lockedSharePassphraseRaw: string
    ) => {
        if (!('hashKey' in parentKeys)) {
            throw new Error('Missing hash key on folder link');
        }

        const formattedDate = format(new Date(), 'Ppp', { locale: dateLocale }).replaceAll(
            RegExp(GLOBAL_FORBIDDEN_CHARACTERS, 'g'),
            ' '
        );
        const restoreFolderName = `Restored files ${formattedDate}`;

        const [Hash, { NodePassphrase, NodePassphraseSignature }, { data: encryptedName }] = await Promise.all([
            generateLookupHash(restoreFolderName, parentKeys.hashKey),
            encryptPassphrase(parentKeys.privateKey, addressKey, lockedSharePassphraseRaw),
            encryptMessage({
                data: restoreFolderName,
                publicKeys: parentKeys.privateKey.toPublic(),
                privateKeys: addressKey,
            }),
        ]);

        const data = {
            Name: encryptedName,
            SignatureAddress: address.Email,
            Hash,
            NodePassphrase,
            NodePassphraseSignature,
            TargetVolumeID: parentVolumeID,
        };

        await debouncedRequest(queryRestoreDriveVolume(lockedSahareMeta.VolumeID, data));
    };

    const restoreVolumes = async (
        readyToRestoreList: {
            lockedShareMeta: ShareMeta;
            decryptedPassphrase: string;
        }[]
    ) => {
        const parentShareId = cache.defaultShare;
        if (!parentShareId || !readyToRestoreList.length) {
            return;
        }

        const parentShareMeta = await getShareMeta(parentShareId);
        const [parentKeys, { privateKey: addressKey, address }] = await Promise.all([
            getLinkKeys(parentShareMeta.ShareID, parentShareMeta.LinkID),
            getPrimaryAddressKey(),
        ]);

        // TODO: Right now BE can process only one request at the time.
        // Remove first item selection, when BE will support multiple volums restore at the same time.
        const restorePromiseList = [readyToRestoreList[0]].map(({ lockedShareMeta, decryptedPassphrase }) =>
            restoreVolume(
                parentShareMeta.VolumeID,
                parentKeys,
                addressKey,
                address,
                lockedShareMeta,
                decryptedPassphrase
            )
        );
        return Promise.all(restorePromiseList);
    };

    const createShare = async (shareId: string, volumeId: string, linkId: string) => {
        const linkType = LinkType.FILE;
        const name = 'New Share';

        const [{ address, privateKey: addressPrivateKey }, { passphraseSessionKey }, meta] = await Promise.all([
            getPrimaryAddressKey(),
            getLinkKeys(shareId, linkId),
            getLinkMeta(shareId, linkId),
        ]);

        const [parentKeys, keyInfo] = await Promise.all([
            getLinkKeys(shareId, meta.ParentLinkID),
            generateNodeKeys(addressPrivateKey),
        ]);

        const {
            NodeKey: ShareKey,
            NodePassphrase: SharePassphrase,
            privateKey: sharePrivateKey,
            NodePassphraseSignature: SharePassphraseSignature,
        } = keyInfo;

        const nameSessionKey = await getDecryptedSessionKey({
            data: meta.EncryptedName,
            privateKeys: parentKeys.privateKey,
        });

        if (!nameSessionKey) {
            throw new Error('Could not get name session key');
        }

        const [PassphraseKeyPacket, NameKeyPacket] = await Promise.all([
            getEncryptedSessionKey(passphraseSessionKey, sharePrivateKey.toPublic()).then(uint8ArrayToBase64String),
            getEncryptedSessionKey(nameSessionKey, sharePrivateKey.toPublic()).then(uint8ArrayToBase64String),
        ]);

        const { Share } = await debouncedRequest<{ Share: { ID: string } }>(
            queryCreateShare(volumeId, {
                Type: 0, // UNUSED
                PermissionsMask: 0,
                AddressID: address.ID,
                RootLinkID: linkId,
                LinkType: linkType,
                Name: name,
                ShareKey,
                SharePassphrase,
                SharePassphraseSignature,
                PassphraseKeyPacket,
                NameKeyPacket,
            })
        );

        // TODO: get share meta from events when BE implements them
        cache.set.emptyShares([{ ShareID: Share.ID, LinkType: linkType }]);

        return {
            Share,
            meta: {
                Name: name,
            },
            keyInfo,
        };
    };

    const deleteChildrenLinks = async (shareId: string, parentLinkId: string, linkIds: string[]) => {
        cache.set.linksLocked(true, shareId, linkIds);
        const batches = chunk(linkIds, BATCH_REQUEST_SIZE);

        const deleteQueue = batches.map((batch, i) => () =>
            debouncedRequest(queryDeleteChildrenLinks(shareId, parentLinkId, batch))
                .then(() => batch)
                .catch((error): string[] => {
                    console.error(`Failed to delete #${i} batch of links: `, error);
                    return [];
                })
        );

        const deletedBatches = await preventLeave(runInQueue(deleteQueue, MAX_THREADS_PER_REQUEST));
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await events.call(shareId);
        return ([] as string[]).concat(...deletedBatches);
    };

    const deleteShare = async (shareId: string) => {
        return api(queryDeleteShare(shareId));
    };

    const events = {
        handleEvents: (shareId: string) => async ({ Events = [] }: { Events: ShareEvent[] }) => {
            const decryptLinkAsync = async (meta: LinkMeta) => {
                const { privateKey } = meta.ParentLinkID
                    ? await getLinkKeys(shareId, meta.ParentLinkID)
                    : await getShareKeys(shareId);

                return decryptLink(meta, privateKey);
            };

            const isTrashedRestoredOrMoved = ({ LinkID, ParentLinkID, Trashed }: LinkMeta) => {
                const existing = cache.get.linkMeta(shareId, LinkID);
                return existing && (existing.Trashed !== Trashed || existing.ParentLinkID !== ParentLinkID);
            };

            const actions = Events.reduce(
                (actions, { EventType, Data, Link }) => {
                    if (EventType === DELETE) {
                        actions.delete.push(Link.LinkID);
                        return actions;
                    }

                    if (isTrashedRestoredOrMoved(Link)) {
                        actions.softDelete.push(Link.LinkID);
                    }

                    const decryptedLinkPromise = decryptLinkAsync(Link);

                    if (EventType === CREATE) {
                        if (Data?.FLAG_RESTORE_COMPLETE) {
                            actions.recovery[Link.ParentLinkID] = [
                                ...(actions.recovery[Link.ParentLinkID] ?? []),
                                decryptedLinkPromise,
                            ];

                            // Updates locked shares
                            debouncedRequest<UserShareResult>(queryUserShares()).then(({ Shares }) => {
                                const lockedShares = Shares.filter((share) => share.Locked && isPrimaryShare(share));
                                cache.setLockedShares(lockedShares);
                                createNotification({
                                    text: c('Success').t`Your files were successfully recovered to "My files".`,
                                });
                            });
                        } else if (Link.Trashed) {
                            actions.trash.push(decryptedLinkPromise);
                        } else {
                            actions.create[Link.ParentLinkID] = [
                                ...(actions.create[Link.ParentLinkID] ?? []),
                                decryptedLinkPromise,
                            ];
                        }
                    }

                    if (EventType === UPDATE_METADATA) {
                        if (Link.Trashed) {
                            actions.trash.push(decryptedLinkPromise);
                        } else {
                            actions.update[Link.ParentLinkID] = [
                                ...(actions.update[Link.ParentLinkID] ?? []),
                                decryptedLinkPromise,
                            ];
                        }
                    }

                    return actions;
                },
                {
                    delete: [] as string[],
                    softDelete: [] as string[],
                    trash: [] as Promise<LinkMeta>[],
                    create: {} as { [parentId: string]: Promise<LinkMeta>[] },
                    update: {} as { [parentId: string]: Promise<LinkMeta>[] },
                    recovery: {} as { [parentId: string]: Promise<LinkMeta>[] },
                }
            );

            cache.delete.links(shareId, actions.delete);
            cache.delete.links(shareId, actions.softDelete, true);

            const trashPromise = Promise.allSettled(actions.trash)
                .then(getSuccessfulSettled)
                .then((trashMetas: LinkMeta[]) => cache.set.trashLinkMetas(trashMetas, shareId, 'unlisted'))
                .catch((e) => console.error(e));

            const createPromises = Object.entries(actions.create).map(async ([parentId, promises]) => {
                const metas = await Promise.allSettled(promises).then(getSuccessfulSettled);
                cache.set.childLinkMetas(metas, shareId, parentId, 'unlisted_create');
                cache.set.foldersOnlyLinkMetas(metas, shareId, parentId, 'unlisted_create');
            });

            const updatePromises = Object.entries(actions.update).map(async ([parentId, promises]) => {
                const metas = await Promise.allSettled(promises).then(getSuccessfulSettled);
                cache.set.childLinkMetas(metas, shareId, parentId, 'unlisted');
                cache.set.foldersOnlyLinkMetas(metas, shareId, parentId, 'unlisted');
            });

            const recoveryPromises = Object.entries(actions.recovery).map(async ([parentId, promises]) => {
                const metas = await Promise.allSettled(promises).then(getSuccessfulSettled);
                cache.set.childLinkMetas(metas, shareId, parentId, 'unlisted');
                cache.set.foldersOnlyLinkMetas(metas, shareId, parentId, 'unlisted');
            });

            await Promise.allSettled([
                trashPromise,
                Promise.allSettled(createPromises).then(logSettledErrors),
                Promise.allSettled(updatePromises).then(logSettledErrors),
                Promise.allSettled(recoveryPromises).then(logSettledErrors),
            ]);
        },

        subscribe: async (shareId: string) => {
            const eventManager = getShareEventManager(shareId) || (await createShareEventManager(shareId));
            eventManager.subscribe(events.handleEvents(shareId));
        },

        call: (shareId: string): Promise<void> => {
            return getShareEventManager(shareId).call();
        },

        callAll: (shareId: string) => Promise.all([eventManager.call(), events.call(shareId)]),
    };

    return {
        initDrive,
        decryptLink,
        getLinkMeta,
        loadLinkCachedThumbnailURL,
        getLinkKeys,
        getFoldersOnlyMetas,
        fetchNextFolderContents,
        getShareKeys,
        getShareMeta,
        getShareMetaShort,
        renameLink,
        createNewFolder,
        fetchAllFolderPages,
        fetchAllFolderPagesWithLoader,
        decryptLinkPassphrase,
        createShare,
        deleteShare,
        moveLink,
        moveLinks,
        deleteChildrenLinks,
        getSharesReadyToRestore,
        restoreVolumes,
        events,
    };
}

export default useDrive;
