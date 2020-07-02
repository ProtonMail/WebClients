import React from 'react';
import { useDriveCache, LinkKeys } from '../../components/DriveCache/DriveCacheProvider';
import { decryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import { useModals } from 'react-components';
import useDriveCrypto from './useDriveCrypto';
import {
    decryptUnsigned,
    generateDriveBootstrap,
    generateNodeHashKey,
    generateLookupHash,
    encryptUnsigned,
    generateNodeKeys,
    encryptPassphrase
} from 'proton-shared/lib/keys/driveKeys';
import { decryptPassphrase } from 'proton-shared/lib/keys/calendarKeys';
import { getDecryptedSessionKey } from 'proton-shared/lib/calendar/decrypt';
import { deserializeUint8Array } from 'proton-shared/lib/helpers/serialization';
import { LinkMetaResult, isFolderLinkMeta, LinkChildrenResult, LinkMeta, LinkType } from '../../interfaces/link';
import { queryGetLink } from '../../api/link';
import { queryFolderChildren, queryCreateFolder } from '../../api/folder';
import { FOLDER_PAGE_SIZE, EVENT_TYPES, MAX_THREADS_PER_REQUEST, DEFAULT_SORT_PARAMS } from '../../constants';
import { ShareMeta, UserShareResult } from '../../interfaces/share';
import { queryShareMeta, queryUserShares, queryRenameLink, queryMoveLink } from '../../api/share';
import { CreatedDriveVolumeResult } from '../../interfaces/volume';
import { queryCreateDriveVolume } from '../../api/volume';
import OnboardingModal from '../../components/OnboardingModal/OnboardingModal';
import { validateLinkName, ValidationError } from '../../utils/validation';
import { lookup } from 'mime-types';
import { ShareEvent, useDriveEventManager } from '../../components/DriveEventManager/DriveEventManagerProvider';
import useDebouncedRequest from '../util/useDebouncedRequest';
import useQueuedFunction from '../util/useQueuedFunction';
import { getSuccessfulSettled, logSettledErrors } from '../../utils/async';
import usePreventLeave from '../util/usePreventLeave';
import runInQueue from '../../utils/runInQueue';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

interface FetchLinkConfig {
    fetchLinkMeta?: (id: string) => Promise<LinkMeta>;
    preventRerenders?: boolean;
    skipCache?: boolean;
}

const { CREATE, DELETE, UPDATE_METADATA } = EVENT_TYPES;

function useDrive() {
    const cache = useDriveCache();
    const { getShareEventManager, createShareEventManager } = useDriveEventManager();
    const queuedFunction = useQueuedFunction();
    const { createModal } = useModals();
    const { getPrimaryAddressKey, getVerificationKeys } = useDriveCrypto();
    const debouncedRequest = useDebouncedRequest();
    const { preventLeave } = usePreventLeave();

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
                ...bootstrap
            })
        );

        cache.set.emptyShares([Volume.Share.ID]);

        return Volume;
    };

    const getUserShares = async () => {
        const shares = cache.get.shareIds();

        if (shares.length) {
            return shares;
        }

        const { Shares } = await debouncedRequest<UserShareResult>(queryUserShares());

        return Shares.map(({ ShareID }) => ShareID);
    };

    const getShareMeta = async (shareId: string) => {
        const cachedMeta = cache.get.shareMeta(shareId);

        if (cachedMeta) {
            return cachedMeta;
        }

        const Share = await debouncedRequest<ShareMeta>(queryShareMeta(shareId));
        cache.set.shareMeta(Share);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await events.subscribe(shareId);

        return Share;
    };

    const initDrive = async () => {
        const shareIds = await getUserShares();

        if (shareIds.length) {
            cache.set.emptyShares(shareIds);
            return getShareMeta(shareIds[0]);
        }

        const { Share } = await createVolume();
        createModal(<OnboardingModal />);
        return getShareMeta(Share.ID);
    };

    const getShareKeys = async (shareId: string) => {
        const cachedKeys = cache.get.shareKeys(shareId);

        if (cachedKeys) {
            return cachedKeys;
        }

        const meta = await getShareMeta(shareId);
        const { privateKeys, publicKeys } = await getVerificationKeys(meta.Creator);
        const decryptedSharePassphrase = await decryptPassphrase({
            armoredPassphrase: meta.Passphrase,
            armoredSignature: meta.PassphraseSignature,
            privateKeys,
            publicKeys
        });

        const privateKey = await decryptPrivateKey(meta.Key, decryptedSharePassphrase);
        const keys = {
            privateKey
        };
        cache.set.shareKeys(keys, shareId);

        return keys;
    };

    const decryptLink = async (meta: LinkMeta, privateKey: OpenPGPKey): Promise<LinkMeta> => {
        return {
            ...meta,
            Name: await decryptUnsigned({ armoredMessage: meta.Name, privateKey })
        };
    };

    const decryptLinkPassphrase = async (shareId: string, meta: LinkMeta, config: FetchLinkConfig = {}) => {
        const [{ privateKey: parentKey }, { publicKeys }] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            meta.ParentLinkID ? await getLinkKeys(shareId, meta.ParentLinkID, config) : await getShareKeys(shareId),
            getVerificationKeys(meta.SignatureAddress)
        ]);

        return decryptPassphrase({
            armoredPassphrase: meta.NodePassphrase,
            armoredSignature: meta.NodePassphraseSignature,
            privateKeys: [parentKey],
            publicKeys
        });
    };

    const getLinkKeys = async (shareId: string, linkId: string, config: FetchLinkConfig = {}): Promise<LinkKeys> => {
        const cachedKeys = cache.get.linkKeys(shareId, linkId);

        if (cachedKeys) {
            return cachedKeys;
        }

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const meta = await getLinkMeta(shareId, linkId, config);
        const decryptedLinkPassphrase = await decryptLinkPassphrase(shareId, meta, config);
        const privateKey = await decryptPrivateKey(meta.NodeKey, decryptedLinkPassphrase);

        if (isFolderLinkMeta(meta)) {
            const keys = {
                privateKey,
                hashKey: await decryptUnsigned({
                    armoredMessage: meta.FolderProperties.NodeHashKey,
                    privateKey
                })
            };
            cache.set.linkKeys(keys, shareId, linkId);
            return keys;
        }

        const blockKeys = deserializeUint8Array(meta.FileProperties.ContentKeyPacket);
        const sessionKeys = await getDecryptedSessionKey(blockKeys, privateKey);
        const keys = {
            privateKey,
            sessionKeys
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
            : (await debouncedRequest<LinkMetaResult>(queryGetLink(shareId, linkId))).Link;

        const { privateKey } = Link.ParentLinkID
            ? await getLinkKeys(shareId, Link.ParentLinkID, config)
            : await getShareKeys(shareId);

        const meta = await decryptLink(Link, privateKey);
        cache.set.linkMeta(meta, shareId, { rerender: !config.preventRerenders });

        return meta;
    };

    const fetchNextFoldersOnlyContents = async (shareId: string, linkId: string) => {
        const listedFolders = cache.get.listedFoldersOnlyLinks(shareId, linkId) || [];

        const PageSize = FOLDER_PAGE_SIZE;
        const Page = Math.floor(listedFolders.length / PageSize);
        const FoldersOnly = 1;

        const { Links } = await debouncedRequest<LinkChildrenResult>(
            queryFolderChildren(shareId, linkId, { Page, PageSize, FoldersOnly })
        );
        const { privateKey } = linkId ? await getLinkKeys(shareId, linkId) : await getShareKeys(shareId);

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
        const { privateKey } = linkId ? await getLinkKeys(shareId, linkId) : await getShareKeys(shareId);

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

    const renameLink = async (
        shareId: string,
        linkId: string,
        parentLinkID: string,
        newName: string,
        type: LinkType
    ) => {
        const error = validateLinkName(newName);

        if (error) {
            throw new ValidationError(error);
        }

        const lowerCaseName = newName.toLowerCase();
        const MIMEType = type === LinkType.FOLDER ? 'Folder' : lookup(newName) || 'application/octet-stream';

        const parentKeys = await getLinkKeys(shareId, parentLinkID);

        if (!('hashKey' in parentKeys)) {
            throw new Error('Missing hash key on folder link');
        }

        const [Hash, encryptedName] = await Promise.all([
            generateLookupHash(lowerCaseName, parentKeys.hashKey),
            encryptUnsigned({
                message: newName,
                publicKey: parentKeys.privateKey.toPublic()
            })
        ]);

        await debouncedRequest(
            queryRenameLink(shareId, linkId, {
                Name: encryptedName,
                MIMEType,
                Hash
            })
        );
    };

    const createNewFolder = queuedFunction(
        'createNewFolder',
        async (shareId: string, ParentLinkID: string, name: string) => {
            // Name Hash is generated from LC, for case-insensitive duplicate detection
            const error = validateLinkName(name);
            const lowerCaseName = name.toLowerCase();

            if (error) {
                throw new ValidationError(error);
            }

            const [parentKeys, { privateKey: addressKey, address }] = await Promise.all([
                getLinkKeys(shareId, ParentLinkID),
                getPrimaryAddressKey()
            ]);

            if (!('hashKey' in parentKeys)) {
                throw new Error('Missing hash key on folder link');
            }

            const [
                Hash,
                { NodeKey, NodePassphrase, privateKey, NodePassphraseSignature },
                encryptedName
            ] = await Promise.all([
                generateLookupHash(lowerCaseName, parentKeys.hashKey),
                generateNodeKeys(parentKeys.privateKey, addressKey),
                encryptUnsigned({
                    message: name,
                    publicKey: parentKeys.privateKey.toPublic()
                })
            ]);

            const { NodeHashKey: NodeHashKey } = await generateNodeHashKey(privateKey.toPublic());

            return debouncedRequest<{ Folder: { ID: string } }>(
                queryCreateFolder(shareId, {
                    Hash,
                    NodeHashKey,
                    Name: encryptedName,
                    NodeKey,
                    NodePassphrase,
                    NodePassphraseSignature,
                    SignatureAddress: address.Email,
                    ParentLinkID
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
            getPrimaryAddressKey()
        ]);

        if (!('hashKey' in parentKeys)) {
            throw new Error('Missing hash key on folder link');
        }

        const lowerCaseName = meta.Name.toLowerCase();

        const [Hash, { NodePassphrase, NodePassphraseSignature }, encryptedName] = await Promise.all([
            generateLookupHash(lowerCaseName, parentKeys.hashKey),
            decryptLinkPassphrase(shareId, meta).then((decryptedLinkPassphrase) =>
                encryptPassphrase(parentKeys.privateKey, addressKey, decryptedLinkPassphrase)
            ),
            encryptUnsigned({
                message: meta.Name,
                publicKey: parentKeys.privateKey.toPublic()
            })
        ]);

        const data = {
            Name: encryptedName,
            Hash,
            ParentLinkID,
            NodePassphrase,
            NodePassphraseSignature,
            SignatureAddress: address.Email
        };

        await debouncedRequest(queryMoveLink(shareId, linkId, data));
        return { Type: meta.Type, Name: meta.Name };
    };

    const moveLinks = async (shareId: string, parentFolderId: string, linkIds: string[]) => {
        const moved: { Name: string; Type: LinkType }[] = [];
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
        await preventLeave(runInQueue(moveQueue, MAX_THREADS_PER_REQUEST));
        return { moved, failed };
    };

    const events = {
        handleEvents: (shareId: string) => async ({ Events = [] }: { Events: ShareEvent[] }) => {
            const isTrashedRestoredOrMoved = ({ LinkID, ParentLinkID, Trashed }: LinkMeta) => {
                const existing = cache.get.linkMeta(shareId, LinkID);
                return existing && (existing.Trashed !== Trashed || existing.ParentLinkID !== ParentLinkID);
            };

            const actions = Events.reduce(
                (actions, { EventType, Link }) => {
                    if (EventType === DELETE) {
                        actions.delete.push(Link.LinkID);
                        return actions;
                    }

                    if (isTrashedRestoredOrMoved(Link)) {
                        actions.softDelete.push(Link.LinkID);
                    }

                    const decryptedLinkPromise = (async () => {
                        const { privateKey } = Link.ParentLinkID
                            ? await getLinkKeys(shareId, Link.ParentLinkID)
                            : await getShareKeys(shareId);

                        return decryptLink(Link, privateKey);
                    })();

                    if (EventType === CREATE) {
                        actions.create[Link.ParentLinkID] = [
                            ...(actions.create[Link.ParentLinkID] ?? []),
                            decryptedLinkPromise
                        ];
                    }

                    if (EventType === UPDATE_METADATA) {
                        if (Link.Trashed) {
                            actions.trash.push(decryptedLinkPromise);
                        } else {
                            actions.update[Link.ParentLinkID] = [
                                ...(actions.update[Link.ParentLinkID] ?? []),
                                decryptedLinkPromise
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
                    update: {} as { [parentId: string]: Promise<LinkMeta>[] }
                }
            );

            cache.delete.links(shareId, actions.delete);
            cache.delete.links(shareId, actions.softDelete, true);

            const trashPromise = Promise.allSettled(actions.trash)
                .then(getSuccessfulSettled)
                .then((trashMetas) => cache.set.trashLinkMetas(trashMetas, shareId, 'unlisted'))
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

            return Promise.allSettled([
                trashPromise,
                Promise.allSettled(createPromises).then(logSettledErrors),
                Promise.allSettled(updatePromises).then(logSettledErrors)
            ]);
        },

        subscribe: async (shareId: string) => {
            const eventManager = getShareEventManager(shareId) || (await createShareEventManager(shareId));
            eventManager.subscribe(events.handleEvents(shareId));
        },

        call: (shareId: string): Promise<void> => {
            return getShareEventManager(shareId).call();
        }
    };

    return {
        initDrive,
        decryptLink,
        getLinkMeta,
        getLinkKeys,
        getFoldersOnlyMetas,
        fetchNextFolderContents,
        getShareKeys,
        getShareMeta,
        renameLink,
        createNewFolder,
        fetchAllFolderPages,
        moveLink,
        moveLinks,
        events
    };
}

export default useDrive;
