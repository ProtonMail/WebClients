import { decryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import { lookup } from 'mime-types';
import { Api } from 'proton-shared/lib/interfaces';
import {
    decryptUnsigned,
    generateLookupHash,
    encryptUnsigned,
    generateNodeKeys,
    encryptPassphrase,
    generateDriveBootstrap,
    generateNodeHashKey,
} from 'proton-shared/lib/keys/driveKeys';
import { decryptPassphrase } from 'proton-shared/lib/keys/calendarKeys';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { deserializeUint8Array } from 'proton-shared/lib/helpers/serialization';
import { getDecryptedSessionKey } from 'proton-shared/lib/calendar/decrypt';

// These imports must go to proton-shared
import { CreatedDriveVolumeResult, DriveVolume } from '../../interfaces/volume';
import { UserShareResult, ShareMeta } from '../../interfaces/share';
import { LinkMeta, isFolderLinkMeta, LinkMetaResult, LinkChildrenResult, LinkType } from '../../interfaces/link';
import { queryCreateDriveVolume } from '../../api/volume';
import { queryUserShares, queryShareMeta, queryRenameLink, queryMoveLink } from '../../api/share';
import { queryGetLink } from '../../api/link';
import { queryFolderChildren, queryCreateFolder } from '../../api/folder';
import { LinkKeys, DriveCache } from '../../components/DriveCache/DriveCacheProvider';
import { validateLinkName, ValidationError } from '../validation';
import { FOLDER_PAGE_SIZE, DEFAULT_SORT_PARAMS, MAX_THREADS_PER_REQUEST } from '../../constants';
import { PrimaryAddressKey, VerificationKeys } from './driveCrypto';
import runInQueue from '../runInQueue';

export interface FetchLinkConfig {
    fetchLinkMeta?: (id: string) => Promise<LinkMeta>;
    preventRerenders?: boolean;
    skipCache?: boolean;
}

export const createVolumeAsync = async (
    api: Api,
    cache: DriveCache,
    getPrimaryAddressKey: () => Promise<PrimaryAddressKey>
) => {
    const { address, privateKey } = await getPrimaryAddressKey();
    const { bootstrap, folderPrivateKey } = await generateDriveBootstrap(privateKey);
    const { NodeHashKey: FolderHashKey } = await generateNodeHashKey(folderPrivateKey.toPublic());

    const { Volume } = await api<CreatedDriveVolumeResult>(
        queryCreateDriveVolume({
            AddressID: address.ID,
            VolumeName: 'MainVolume',
            ShareName: 'MainShare',
            FolderHashKey,
            ...bootstrap,
        })
    );

    cache.set.emptyShares([Volume.Share.ID]);

    return Volume;
};

export const getUserSharesAsync = async (api: Api, cache: DriveCache) => {
    const shares = cache.get.shareIds();

    if (shares.length) {
        return shares;
    }

    const { Shares } = await api<UserShareResult>(queryUserShares());

    return Shares.map(({ ShareID }) => ShareID);
};

export const getShareMetaAsync = async (
    api: Api,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    shareId: string
) => {
    const cachedMeta = cache.get.shareMeta(shareId);

    if (cachedMeta) {
        return cachedMeta;
    }

    const Share = await api<ShareMeta>(queryShareMeta(shareId));
    cache.set.shareMeta(Share);
    await subscribeToEvents(shareId);

    return Share;
};

export const initDriveAsync = async (
    cache: DriveCache,
    createVolume: () => Promise<DriveVolume>,
    getUserShares: () => Promise<string[]>,
    getShareMeta: (shareId: string) => Promise<ShareMeta>,
    createOnboardingModal: () => void
) => {
    const shareIds = await getUserShares();
    let shareId = shareIds[0];

    if (shareId) {
        cache.set.emptyShares(shareIds);
    } else {
        const { Share } = await createVolume();
        createOnboardingModal();
        shareId = Share.ID;
    }

    return getShareMeta(shareId);
};

export const getShareKeysAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    shareId: string
) => {
    const cachedKeys = cache.get.shareKeys(shareId);

    if (cachedKeys) {
        return cachedKeys;
    }

    const meta = await getShareMetaAsync(api, cache, subscribeToEvents, shareId);
    const { privateKeys, publicKeys } = await getVerificationKeys(meta.Creator);
    const decryptedSharePassphrase = await decryptPassphrase({
        armoredPassphrase: meta.Passphrase,
        armoredSignature: meta.PassphraseSignature,
        privateKeys,
        publicKeys,
    });

    const privateKey = await decryptPrivateKey(meta.Key, decryptedSharePassphrase);
    const keys = {
        privateKey,
    };
    cache.set.shareKeys(keys, shareId);

    return keys;
};

export const decryptLinkAsync = async (meta: LinkMeta, privateKey: OpenPGPKey): Promise<LinkMeta> => {
    return {
        ...meta,
        Name: await decryptUnsigned({ armoredMessage: meta.Name, privateKey }),
    };
};

export const decryptLinkPassphraseAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    shareId: string,
    meta: LinkMeta,
    config: FetchLinkConfig = {}
) => {
    const [{ privateKey: parentKey }, { publicKeys }] = await Promise.all([
        meta.ParentLinkID
            ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
              await getLinkKeysAsync(
                  api,
                  getVerificationKeys,
                  cache,
                  subscribeToEvents,
                  shareId,
                  meta.ParentLinkID,
                  config
              )
            : await getShareKeysAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId),
        getVerificationKeys(meta.SignatureAddress),
    ]);

    return decryptPassphrase({
        armoredPassphrase: meta.NodePassphrase,
        armoredSignature: meta.NodePassphraseSignature,
        privateKeys: [parentKey],
        publicKeys,
    });
};

export const getLinkKeysAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    shareId: string,
    linkId: string,
    config: FetchLinkConfig = {}
): Promise<LinkKeys> => {
    const cachedKeys = cache.get.linkKeys(shareId, linkId);

    if (cachedKeys) {
        return cachedKeys;
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const meta = await getLinkMetaAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId, linkId, config);
    const decryptedLinkPassphrase = await decryptLinkPassphraseAsync(
        api,
        getVerificationKeys,
        cache,
        subscribeToEvents,
        shareId,
        meta,
        config
    );
    const privateKey = await decryptPrivateKey(meta.NodeKey, decryptedLinkPassphrase);

    if (isFolderLinkMeta(meta)) {
        const keys = {
            privateKey,
            hashKey: await decryptUnsigned({
                armoredMessage: meta.FolderProperties.NodeHashKey,
                privateKey,
            }),
        };
        cache.set.linkKeys(keys, shareId, linkId);
        return keys;
    }

    const blockKeys = deserializeUint8Array(meta.FileProperties.ContentKeyPacket);
    const sessionKeys = await getDecryptedSessionKey(blockKeys, privateKey);

    const keys = {
        privateKey,
        sessionKeys,
    };
    cache.set.linkKeys(keys, shareId, linkId);
    return keys;
};

export const getLinkMetaAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    shareId: string,
    linkId: string,
    config: FetchLinkConfig = {}
): Promise<LinkMeta> => {
    const cachedMeta = cache.get.linkMeta(shareId, linkId);

    if (!config.skipCache && cachedMeta) {
        return cachedMeta;
    }

    const Link = config.fetchLinkMeta
        ? await config.fetchLinkMeta(linkId)
        : (await api<LinkMetaResult>(queryGetLink(shareId, linkId))).Link;

    const { privateKey } = Link.ParentLinkID
        ? await getLinkKeysAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId, Link.ParentLinkID, config)
        : await getShareKeysAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId);

    const meta = await decryptLinkAsync(Link, privateKey);
    cache.set.linkMeta(meta, shareId, { rerender: !config.preventRerenders });

    return meta;
};

const fetchNextFoldersOnlyContentsAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    shareId: string,
    linkId: string
) => {
    const listedFolders = cache.get.listedFoldersOnlyLinks(shareId, linkId) || [];

    const PageSize = FOLDER_PAGE_SIZE;
    const Page = Math.floor(listedFolders.length / PageSize);
    const FoldersOnly = 1;

    const { Links } = await api<LinkChildrenResult>(
        queryFolderChildren(shareId, linkId, { Page, PageSize, FoldersOnly })
    );
    const { privateKey } = await getLinkKeysAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId, linkId);

    const decryptedLinks = await Promise.all(Links.map((link) => decryptLinkAsync(link, privateKey)));
    cache.set.foldersOnlyLinkMetas(
        decryptedLinks,
        shareId,
        linkId,
        Links.length < PageSize ? 'complete' : 'incremental'
    );
};

export const getFoldersOnlyMetasAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    shareId: string,
    linkId: string,
    fetchNextPage = false
) => {
    const listedFolders = cache.get.listedFoldersOnlyLinks(shareId, linkId) || [];
    const complete = cache.get.foldersOnlyComplete(shareId, linkId);
    if ((!complete && listedFolders.length === 0) || fetchNextPage) {
        await fetchNextFoldersOnlyContentsAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId, linkId);
    }

    const linkMetas = cache.get.foldersOnlyLinkMetas(shareId, linkId) || [];
    return linkMetas;
};

export const fetchNextFolderContentsAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    shareId: string,
    linkId: string,
    sortParams = DEFAULT_SORT_PARAMS
) => {
    const listedChildren = cache.get.listedChildLinks(shareId, linkId, sortParams) || [];

    const PageSize = FOLDER_PAGE_SIZE;
    const Page = Math.floor(listedChildren.length / PageSize);
    const Sort = sortParams?.sortField;
    const Desc = sortParams?.sortOrder === SORT_DIRECTION.DESC ? 1 : 0;

    const { Links } = await api<LinkChildrenResult>(
        queryFolderChildren(shareId, linkId, { Page, PageSize, Sort, Desc })
    );
    const { privateKey } = await getLinkKeysAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId, linkId);

    const decryptedLinks = await Promise.all(Links.map((link) => decryptLinkAsync(link, privateKey)));
    cache.set.childLinkMetas(
        decryptedLinks,
        shareId,
        linkId,
        Links.length < PageSize ? 'complete' : 'incremental',
        sortParams
    );
};

export const fetchAllFolderPagesAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    shareId: string,
    linkId: string
) => {
    if (!cache.get.childrenComplete(shareId, linkId)) {
        await fetchNextFolderContentsAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId, linkId);
        await fetchAllFolderPagesAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId, linkId);
    }
};

export const renameLinkAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
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

    const parentKeys = await getLinkKeysAsync(
        api,
        getVerificationKeys,
        cache,
        subscribeToEvents,
        shareId,
        parentLinkID
    );

    if (!('hashKey' in parentKeys)) {
        throw new Error('Missing hash key on folder link');
    }

    const [Hash, encryptedName] = await Promise.all([
        generateLookupHash(lowerCaseName, parentKeys.hashKey),
        encryptUnsigned({
            message: newName,
            publicKey: parentKeys.privateKey.toPublic(),
        }),
    ]);

    await api(
        queryRenameLink(shareId, linkId, {
            Name: encryptedName,
            MIMEType,
            Hash,
        })
    );
};

export const createNewFolderAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    getPrimaryAddressKey: () => Promise<PrimaryAddressKey>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    shareId: string,
    ParentLinkID: string,
    name: string
) => {
    // Name Hash is generated from LC, for case-insensitive duplicate detection
    const error = validateLinkName(name);
    const lowerCaseName = name.toLowerCase();

    if (error) {
        throw new ValidationError(error);
    }

    const [parentKeys, { privateKey: addressKey, address }] = await Promise.all([
        getLinkKeysAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId, ParentLinkID),
        getPrimaryAddressKey(),
    ]);

    if (!('hashKey' in parentKeys)) {
        throw new Error('Missing hash key on folder link');
    }

    const [Hash, { NodeKey, NodePassphrase, privateKey, NodePassphraseSignature }, encryptedName] = await Promise.all([
        generateLookupHash(lowerCaseName, parentKeys.hashKey),
        generateNodeKeys(parentKeys.privateKey, addressKey),
        encryptUnsigned({
            message: name,
            publicKey: parentKeys.privateKey.toPublic(),
        }),
    ]);

    const { NodeHashKey } = await generateNodeHashKey(privateKey.toPublic());

    return api<{ Folder: { ID: string } }>(
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
};

export const moveLinkAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    getPrimaryAddressKey: () => Promise<PrimaryAddressKey>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    eventsCall: (shareId: string) => Promise<void>,
    shareId: string,
    ParentLinkID: string,
    linkId: string
) => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    await eventsCall(shareId); // Name could have changed while moving
    const [meta, parentKeys, { privateKey: addressKey, address }] = await Promise.all([
        getLinkMetaAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId, linkId),
        getLinkKeysAsync(api, getVerificationKeys, cache, subscribeToEvents, shareId, ParentLinkID),
        getPrimaryAddressKey(),
    ]);

    if (!('hashKey' in parentKeys)) {
        throw new Error('Missing hash key on folder link');
    }

    const lowerCaseName = meta.Name.toLowerCase();

    const [Hash, { NodePassphrase, NodePassphraseSignature }, encryptedName] = await Promise.all([
        generateLookupHash(lowerCaseName, parentKeys.hashKey),
        decryptLinkPassphraseAsync(
            api,
            getVerificationKeys,
            cache,
            subscribeToEvents,
            shareId,
            meta
        ).then((decryptedLinkPassphrase) =>
            encryptPassphrase(parentKeys.privateKey, addressKey, decryptedLinkPassphrase)
        ),
        encryptUnsigned({
            message: meta.Name,
            publicKey: parentKeys.privateKey.toPublic(),
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

    await api(queryMoveLink(shareId, linkId, data));
    return { LinkID: meta.LinkID, Type: meta.Type, Name: meta.Name };
};

export const moveLinksAsync = async (
    api: Api,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,
    getPrimaryAddressKey: () => Promise<PrimaryAddressKey>,
    preventLeave: <T>(task: Promise<T>) => Promise<T>,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    eventsCall: (shareId: string) => Promise<void>,
    shareId: string,
    parentFolderId: string,
    linkIds: string[]
) => {
    cache.set.linksLocked(true, shareId, linkIds);
    const moved: { LinkID: string; Name: string; Type: LinkType }[] = [];
    const failed: string[] = [];
    const moveQueue = linkIds.map((linkId) => async () => {
        await moveLinkAsync(
            api,
            getVerificationKeys,
            getPrimaryAddressKey,
            cache,
            subscribeToEvents,
            eventsCall,
            shareId,
            parentFolderId,
            linkId
        )
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
        await eventsCall(shareId);
        return { moved, failed };
    } finally {
        cache.set.linksLocked(false, shareId, linkIds);
    }
};
