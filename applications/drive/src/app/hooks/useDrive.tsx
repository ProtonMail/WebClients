import React from 'react';
import { useDriveCache, LinkKeys } from '../components/DriveCache/DriveCacheProvider';
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
import { LinkMetaResult, isFolderLinkMeta, LinkChildrenResult, LinkMeta, LinkType } from '../interfaces/link';
import { queryGetLink } from '../api/link';
import { queryFolderChildren, queryCreateFolder } from '../api/folder';
import { FOLDER_PAGE_SIZE, EVENT_TYPES } from '../constants';
import { ShareMeta, UserShareResult } from '../interfaces/share';
import { queryShareMeta, queryUserShares, queryRenameLink, queryMoveLink } from '../api/share';
import { CreatedDriveVolumeResult } from '../interfaces/volume';
import { queryCreateDriveVolume } from '../api/volume';
import OnboardingModal from '../components/OnboardingModal/OnboardingModal';
import { validateLinkName, ValidationError } from '../utils/validation';
import { lookup } from 'mime-types';
import { ShareEvent, useDriveEventManager } from '../components/DriveEventManager/DriveEventManagerProvider';
import useDebouncedPromise from './useDebouncedPromise';
import useQueuedFunction from './useQueuedFunction';

interface FetchLinkConfig {
    fetchLinkMeta?: (id: string) => Promise<LinkMeta>;
    preventRerenders?: boolean;
    skipCache?: boolean;
}

const { CREATE, DELETE, TRASH, UPDATE, UPDATE_CONTENT, RESTORE, MOVE } = EVENT_TYPES;

function useDrive() {
    const cache = useDriveCache();
    const { getShareEventManager, createShareEventManager } = useDriveEventManager();
    const queuedFunction = useQueuedFunction();
    const { createModal } = useModals();
    const { getPrimaryAddressKey, getVerificationKeys } = useDriveCrypto();
    const debouncedRequest = useDebouncedPromise();

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
                VolumeMaxSpace: 1000000000, // TODO: this will be controlled dynamically
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

        const { privateKeys, publicKeys } = await getVerificationKeys(meta.AddressID);
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
            getVerificationKeys(meta.SignatureAddressID)
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

    const fetchNextFolderContents = async (
        shareId: string,
        linkId: string,
        sortParams?: { sortField: string; sortOrder: string }
    ) => {
        const listedChildren = cache.get.listedChildLinks(shareId, linkId, sortParams) || [];

        const PageSize = FOLDER_PAGE_SIZE;
        const Page = Math.floor(listedChildren.length / PageSize);
        const SortField = sortParams?.sortField;
        const SortOrder = sortParams?.sortOrder;

        const { Links } = await debouncedRequest<LinkChildrenResult>(
            queryFolderChildren(shareId, linkId, { Page, PageSize, SortField, SortOrder })
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
        const MimeType = type === LinkType.FOLDER ? 'Folder' : lookup(newName) || 'application/octet-stream';

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
                MimeType,
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
                    SignatureAddressID: address.ID,
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
            SignatureAddressID: address.ID
        };

        await debouncedRequest(queryMoveLink(shareId, linkId, data));
        return { Type: meta.Type, Name: meta.Name };
    };

    const events = {
        handleEvents: (shareId: string) => async ({ Events = [] }: { Events: ShareEvent[] }) => {
            const deleteEvents = Events.filter(({ EventType }) => EventType === DELETE);
            const softDeleteEvents = Events.filter(({ EventType }) => [TRASH, RESTORE, MOVE].includes(EventType));

            cache.delete.links(
                shareId,
                deleteEvents.map(({ Link: { LinkID } }) => LinkID)
            );

            cache.delete.links(
                shareId,
                softDeleteEvents.map(({ Link: { LinkID } }) => LinkID),
                true
            );

            await Promise.allSettled(
                Events.filter(({ EventType }) =>
                    [CREATE, UPDATE, UPDATE_CONTENT, TRASH, RESTORE, MOVE].includes(EventType)
                ).map(async ({ EventType, Link }) => {
                    const { privateKey } = Link.ParentLinkID
                        ? await getLinkKeys(shareId, Link.ParentLinkID)
                        : await getShareKeys(shareId);

                    const meta = await decryptLink(Link, privateKey);

                    if (EventType === TRASH) {
                        cache.set.trashLinkMetas([meta], shareId, 'unlisted');
                    } else {
                        const method = EventType === CREATE ? 'unlisted_create' : 'unlisted';
                        cache.set.childLinkMetas([meta], shareId, Link.ParentLinkID, method);
                        cache.set.foldersOnlyLinkMetas([meta], shareId, Link.ParentLinkID, method);
                    }
                })
            );
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
        events
    };
}

export default useDrive;
