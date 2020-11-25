import { decryptPrivateKey, OpenPGPKey, SessionKey, encryptMessage } from 'pmcrypto';
import { Api } from 'proton-shared/lib/interfaces';
import {
    decryptUnsigned,
    generateNodeKeys,
    generateDriveBootstrap,
    generateNodeHashKey,
    encryptPassphrase,
    encryptName,
} from 'proton-shared/lib/keys/driveKeys';
import { FEATURE_FLAGS, SORT_DIRECTION } from 'proton-shared/lib/constants';
import { base64StringToUint8Array, uint8ArrayToBase64String } from 'proton-shared/lib/helpers/encoding';

// These imports must go to proton-shared
import { getEncryptedSessionKey } from 'proton-shared/lib/calendar/encrypt';
import { chunk } from 'proton-shared/lib/helpers/array';
import { CreatedDriveVolumeResult, DriveVolume } from '../../interfaces/volume';
import { UserShareResult, ShareMeta, ShareMetaShort, ShareFlags } from '../../interfaces/share';
import {
    LinkMeta,
    isFolderLinkMeta,
    LinkMetaResult,
    LinkChildrenResult,
    LinkType,
    SortParams,
} from '../../interfaces/link';
import { queryCreateDriveVolume } from '../../api/volume';
import {
    queryUserShares,
    queryShareMeta,
    queryRenameLink,
    queryMoveLink,
    queryCreateShare,
    queryDeleteShare,
} from '../../api/share';
import { queryDeleteChildrenLinks, queryGetLink } from '../../api/link';
import { queryFolderChildren, queryCreateFolder } from '../../api/folder';
import { LinkKeys, DriveCache, ShareKeys } from '../../components/DriveCache/DriveCacheProvider';
import { validateLinkName, ValidationError } from '../validation';
import { FOLDER_PAGE_SIZE, DEFAULT_SORT_PARAMS, MAX_THREADS_PER_REQUEST, BATCH_REQUEST_SIZE } from '../../constants';
import { decryptPassphrase, getDecryptedSessionKey, PrimaryAddressKey, VerificationKeys } from './driveCrypto';
import runInQueue from '../runInQueue';
import { isPrimaryShare } from '../share';
import { generateLookupHash } from '../hash';
import { mimetypeFromExtension } from '../MimeTypeParser/helpers';

export interface FetchLinkConfig {
    fetchLinkMeta?: (id: string) => Promise<LinkMeta>;
    preventRerenders?: boolean;
    skipCache?: boolean;
}

export const createShareAsync = async (
    api: Api,
    cache: DriveCache,
    shareId: string,
    volumeId: string,
    linkId: string,
    Name: string,
    linkType: LinkType,
    getPrimaryAddressKey: () => Promise<PrimaryAddressKey>,
    getLinkMeta: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkMeta>,
    getLinkKeys: (shareId: string, linkId: string) => Promise<LinkKeys>
) => {
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

    const { Share } = await api<{ Share: { ID: string } }>(
        queryCreateShare(volumeId, {
            Type: 0, // UNUSED
            PermissionsMask: 0,
            AddressID: address.ID,
            RootLinkID: linkId,
            LinkType: linkType,
            Name,
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
            Name,
        },
        keyInfo,
    };
};

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

    // TODO: get share meta from events when BE implements them
    cache.set.emptyShares([{ ShareID: Volume.Share.ID, LinkType: LinkType.FOLDER, Flags: ShareFlags.PrimaryShare }]);

    return Volume;
};

export const getUserSharesAsync = async (api: Api, cache: DriveCache): Promise<[string[], string | undefined]> => {
    const shares = cache.get.shareIds();

    if (shares.length) {
        return [shares, cache.defaultShare];
    }

    const { Shares } = await api<UserShareResult>(queryUserShares());
    const shareIds = Shares.map(({ ShareID }) => ShareID);
    const defaultShare = Shares.find(isPrimaryShare);
    cache.set.emptyShares(Shares);

    if (defaultShare) {
        cache.setDefaultShare(defaultShare.ShareID);
    }

    return [shareIds, defaultShare?.ShareID];
};

export const getShareMetaAsync = async (
    api: Api,
    cache: DriveCache,
    subscribeToEvents: (shareId: string) => Promise<void>,
    shareId: string
): Promise<ShareMeta> => {
    const cachedMeta = cache.get.shareMeta(shareId);

    if (cachedMeta && 'Passphrase' in cachedMeta) {
        return cachedMeta;
    }

    const Share = await api<ShareMeta>(queryShareMeta(shareId));
    cache.set.shareMeta(Share);
    await subscribeToEvents(shareId);

    if (isPrimaryShare(Share)) {
        cache.setDefaultShare(Share.ShareID);
    }

    return Share;
};

export const getShareMetaShortAsync = async (
    shareId: string,
    cache: DriveCache,
    getShareMeta: (shareId: string) => Promise<ShareMeta>
): Promise<ShareMetaShort> => {
    const cachedMeta = cache.get.shareMeta(shareId);

    if (cachedMeta) {
        return cachedMeta;
    }

    return getShareMeta(shareId);
};

export const initDriveAsync = async (
    createVolume: () => Promise<DriveVolume>,
    getUserShares: () => Promise<[string[], string | undefined]>,
    getShareMeta: (shareId: string) => Promise<ShareMeta>
) => {
    const [, defaultShare] = await getUserShares();
    let shareId = defaultShare;

    if (!shareId) {
        const { Share } = await createVolume();
        shareId = Share.ID;
    }

    return getShareMeta(shareId);
};

export const getShareKeysAsync = async (
    api: Api,
    cache: DriveCache,
    shareId: string,
    decryptSharePassphrase: (
        meta: ShareMeta
    ) => Promise<{
        decryptedPassphrase: string;
        sessionKey: SessionKey;
    }>,
    subscribeToEvents: (shareId: string) => Promise<void>
) => {
    const cachedKeys = cache.get.shareKeys(shareId);

    if (cachedKeys) {
        return cachedKeys;
    }

    const meta = await getShareMetaAsync(api, cache, subscribeToEvents, shareId);
    const { decryptedPassphrase } = await decryptSharePassphrase(meta);

    const privateKey = await decryptPrivateKey(meta.Key, decryptedPassphrase);
    const keys = {
        privateKey,
    };
    cache.set.shareKeys(keys, shareId);

    return keys;
};

export const decryptLinkAsync = async (meta: LinkMeta, privateKey: OpenPGPKey): Promise<LinkMeta> => {
    return {
        ...meta,
        EncryptedName: meta.Name,
        Name: await decryptUnsigned({ armoredMessage: meta.Name, privateKey }),
    };
};

export const decryptLinkPassphraseAsync = async (
    shareId: string,
    getLinkKeys: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkKeys>,
    getShareKeys: (shareId: string) => Promise<ShareKeys>,
    getVerificationKeys: (email: string) => Promise<VerificationKeys>,

    meta: LinkMeta,
    config: FetchLinkConfig = {}
) => {
    const [{ privateKey: parentKey }, { publicKeys }] = await Promise.all([
        meta.ParentLinkID
            ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
              await getLinkKeys(shareId, meta.ParentLinkID, config)
            : await getShareKeys(shareId),
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
    decryptLinkPassphrase: (
        shareId: string,
        linkMeta: LinkMeta,
        config?: FetchLinkConfig | undefined
    ) => Promise<{
        decryptedPassphrase: string;
        sessionKey: SessionKey;
    }>,
    getLinkMeta: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkMeta>,
    cache: DriveCache,
    shareId: string,
    linkId: string,
    config: FetchLinkConfig = {}
): Promise<LinkKeys> => {
    const cachedKeys = cache.get.linkKeys(shareId, linkId);

    if (cachedKeys) {
        return cachedKeys;
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const meta = await getLinkMeta(shareId, linkId, config);
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
    const sessionKeys = await getDecryptedSessionKey({ data: blockKeys, privateKeys: privateKey });

    const keys = {
        privateKey,
        sessionKeys,
        passphraseSessionKey,
    };
    cache.set.linkKeys(keys, shareId, linkId);
    return keys;
};

export const getLinkMetaAsync = async (
    api: Api,
    getLinkKeys: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkKeys>,
    getShareKeys: (shareId: string) => Promise<ShareKeys>,
    decryptLink: (meta: LinkMeta, privateKey: OpenPGPKey) => Promise<LinkMeta>,
    cache: DriveCache,
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
        ? await getLinkKeys(shareId, Link.ParentLinkID, config)
        : await getShareKeys(shareId);

    const meta = await decryptLink(Link, privateKey);
    cache.set.linkMeta(meta, shareId, { rerender: !config.preventRerenders });

    return meta;
};

export const fetchNextFoldersOnlyContentsAsync = async (
    api: Api,
    getLinkKeys: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkKeys>,
    decryptLink: (meta: LinkMeta, privateKey: OpenPGPKey) => Promise<LinkMeta>,
    cache: DriveCache,
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
    const { privateKey } = await getLinkKeys(shareId, linkId);

    const decryptedLinks = await Promise.all(Links.map((link) => decryptLink(link, privateKey)));
    cache.set.foldersOnlyLinkMetas(
        decryptedLinks,
        shareId,
        linkId,
        Links.length < PageSize ? 'complete' : 'incremental'
    );
};

export const getFoldersOnlyMetasAsync = async (
    fetchNextFoldersOnlyContents: (shareId: string, linkId: string) => Promise<void>,
    cache: DriveCache,
    shareId: string,
    linkId: string,
    fetchNextPage = false
) => {
    const listedFolders = cache.get.listedFoldersOnlyLinks(shareId, linkId) || [];
    const complete = cache.get.foldersOnlyComplete(shareId, linkId);
    if ((!complete && listedFolders.length === 0) || fetchNextPage) {
        await fetchNextFoldersOnlyContents(shareId, linkId);
    }

    const linkMetas = cache.get.foldersOnlyLinkMetas(shareId, linkId) || [];
    return linkMetas;
};

export const fetchNextFolderContentsAsync = async (
    api: Api,
    getLinkKeys: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkKeys>,
    decryptLink: (meta: LinkMeta, privateKey: OpenPGPKey) => Promise<LinkMeta>,
    cache: DriveCache,
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

export const fetchAllFolderPagesAsync = async (
    fetchNextFolderContents: (shareId: string, linkId: string, sortParams?: SortParams) => Promise<void>,
    cache: DriveCache,
    shareId: string,
    linkId: string
) => {
    if (!cache.get.childrenComplete(shareId, linkId)) {
        await fetchNextFolderContents(shareId, linkId);
        await fetchAllFolderPagesAsync(fetchNextFolderContents, cache, shareId, linkId);
    }
};

export const renameLinkAsync = async (
    api: Api,
    getLinkKeys: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkKeys>,
    getLinkMeta: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkMeta>,
    getPrimaryAddressKey: () => Promise<PrimaryAddressKey>,
    shareId: string,
    linkId: string,
    parentLinkID: string,
    newName: string
) => {
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

    const MIMEType = !FEATURE_FLAGS.includes('mime-types-parser') ? await mimetypeFromExtension(newName) : undefined;

    await api(
        queryRenameLink(shareId, linkId, {
            Name: encryptedName,
            Hash,
            SignatureAddress: address.Email,
            MIMEType,
        })
    );
};

export const createNewFolderAsync = async (
    api: Api,
    getLinkKeys: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkKeys>,
    getPrimaryAddressKey: () => Promise<PrimaryAddressKey>,
    shareId: string,
    ParentLinkID: string,
    name: string
) => {
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

    const [Hash, { NodeKey, NodePassphrase, privateKey, NodePassphraseSignature }, encryptedName] = await Promise.all([
        generateLookupHash(name, parentKeys.hashKey),
        generateNodeKeys(parentKeys.privateKey, addressKey),
        encryptName(name, parentKeys.privateKey.toPublic(), addressKey),
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
    getPrimaryAddressKey: () => Promise<PrimaryAddressKey>,
    eventsCall: (shareId: string) => Promise<void>,
    getLinkMeta: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkMeta>,
    getLinkKeys: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkKeys>,
    decryptLinkPassphrase: (
        shareId: string,
        linkMeta: LinkMeta,
        config?: FetchLinkConfig | undefined
    ) => Promise<{
        decryptedPassphrase: string;
        sessionKey: SessionKey;
    }>,
    shareId: string,
    ParentLinkID: string,
    linkId: string
) => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    await eventsCall(shareId); // Name could have changed while moving
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

    await api(queryMoveLink(shareId, linkId, data));
    return { LinkID: meta.LinkID, Type: meta.Type, Name: meta.Name };
};

export const moveLinksAsync = async (
    moveLink: (
        shareId: string,
        ParentLinkID: string,
        linkId: string
    ) => Promise<{
        LinkID: string;
        Type: LinkType;
        Name: string;
    }>,
    preventLeave: <T>(task: Promise<T>) => Promise<T>,
    cache: DriveCache,
    eventsCall: (shareId: string) => Promise<void>,
    shareId: string,
    parentFolderId: string,
    linkIds: string[]
) => {
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
        await eventsCall(shareId);
        return { moved, failed };
    } finally {
        cache.set.linksLocked(false, shareId, linkIds);
    }
};

export const deleteChildrenLinksAsync = async (
    shareId: string,
    parentLinkId: string,
    linkIds: string[],
    api: Api,
    cache: DriveCache,
    eventsCall: (shareId: string) => Promise<any>,
    preventLeave: <T>(task: Promise<T>) => Promise<T>
) => {
    cache.set.linksLocked(true, shareId, linkIds);
    const batches = chunk(linkIds, BATCH_REQUEST_SIZE);

    const deleteQueue = batches.map((batch, i) => () =>
        api(queryDeleteChildrenLinks(shareId, parentLinkId, batch))
            .then(() => batch)
            .catch((error): string[] => {
                console.error(`Failed to delete #${i} batch of links: `, error);
                return [];
            })
    );

    const deletedBatches = await preventLeave(runInQueue(deleteQueue, MAX_THREADS_PER_REQUEST));
    await eventsCall(shareId);
    return ([] as string[]).concat(...deletedBatches);
};

export const deleteShareAsync = async (api: Api, shareId: string) => {
    return api(queryDeleteShare(shareId));
};
