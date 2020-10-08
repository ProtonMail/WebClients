import { OpenPGPKey } from 'pmcrypto';
import { usePreventLeave, useGlobalLoader } from 'react-components';
import { c } from 'ttag';
import useDriveCrypto from './useDriveCrypto';
import { LinkMeta, LinkType } from '../../interfaces/link';
import { useDriveCache, LinkKeys } from '../../components/DriveCache/DriveCacheProvider';
import { DEFAULT_SORT_PARAMS } from '../../constants';
import useDebouncedRequest from '../util/useDebouncedRequest';
import useQueuedFunction from '../util/useQueuedFunction';
import useEvents from './useEvents';

import {
    getShareMetaAsync,
    initDriveAsync,
    getShareKeysAsync,
    decryptLinkAsync,
    FetchLinkConfig,
    getLinkKeysAsync,
    getLinkMetaAsync,
    getFoldersOnlyMetasAsync,
    fetchAllFolderPagesAsync,
    fetchNextFolderContentsAsync,
    renameLinkAsync,
    createNewFolderAsync,
    moveLinkAsync,
    moveLinksAsync,
    createVolumeAsync,
    getUserSharesAsync,
    decryptLinkPassphraseAsync,
    fetchNextFoldersOnlyContentsAsync,
    createShareAsync,
    getShareMetaShortAsync,
    deleteChildrenLinksAsync,
} from '../../utils/drive/drive';

function useDrive() {
    const cache = useDriveCache();
    const queuedFunction = useQueuedFunction();
    const withGlobalLoader = useGlobalLoader({ text: c('Info').t`Loading folder contents` });
    const { getPrimaryAddressKey, getVerificationKeys, decryptSharePassphrase } = useDriveCrypto();
    const debouncedRequest = useDebouncedRequest();
    const { preventLeave } = usePreventLeave();
    const events = useEvents();

    const getShareMeta = async (shareId: string) => {
        return getShareMetaAsync(debouncedRequest, cache, events.subscribe, shareId);
    };

    const getShareMetaShort = async (shareId: string) => {
        return getShareMetaShortAsync(shareId, cache, getShareMeta);
    };

    const createVolume = async () => {
        return createVolumeAsync(debouncedRequest, cache, getPrimaryAddressKey);
    };

    const getUserShares = async () => {
        return getUserSharesAsync(debouncedRequest, cache);
    };

    const initDrive = async () => {
        return initDriveAsync(createVolume, getUserShares, getShareMeta);
    };

    const getShareKeys = async (shareId: string) => {
        const keys = await getShareKeysAsync(
            debouncedRequest,
            cache,
            shareId,
            decryptSharePassphrase,
            events.subscribe
        );
        return keys;
    };

    const decryptLink = async (meta: LinkMeta, privateKey: OpenPGPKey): Promise<LinkMeta> => {
        const linkMeta = await decryptLinkAsync(meta, privateKey);
        return linkMeta;
    };

    const getLinkKeys = async (shareId: string, linkId: string, config: FetchLinkConfig = {}): Promise<LinkKeys> => {
        const keys = await getLinkKeysAsync(
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            decryptLinkPassphrase,
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            getLinkMeta,
            cache,
            shareId,
            linkId,
            config
        );
        return keys;
    };

    const getLinkMeta = async (shareId: string, linkId: string, config: FetchLinkConfig = {}): Promise<LinkMeta> => {
        const meta = await getLinkMetaAsync(
            debouncedRequest,
            getLinkKeys,
            getShareKeys,
            cache,
            shareId,
            linkId,
            config
        );
        return meta;
    };

    const decryptLinkPassphrase = (shareId: string, linkMeta: LinkMeta, config?: FetchLinkConfig) => {
        return decryptLinkPassphraseAsync(shareId, getLinkKeys, getShareKeys, getVerificationKeys, linkMeta, config);
    };

    const fetchNextFoldersOnlyContents = (shareId: string, linkId: string) => {
        return fetchNextFoldersOnlyContentsAsync(debouncedRequest, getLinkKeys, cache, shareId, linkId);
    };

    const getFoldersOnlyMetas = async (shareId: string, linkId: string, fetchNextPage = false) => {
        const linkMetas = await getFoldersOnlyMetasAsync(
            fetchNextFoldersOnlyContents,
            cache,
            shareId,
            linkId,
            fetchNextPage
        );
        return linkMetas;
    };

    const fetchNextFolderContents = async (shareId: string, linkId: string, sortParams = DEFAULT_SORT_PARAMS) => {
        await fetchNextFolderContentsAsync(debouncedRequest, getLinkKeys, cache, shareId, linkId, sortParams);
    };

    const fetchAllFolderPages = async (shareId: string, linkId: string) => {
        await fetchAllFolderPagesAsync(fetchNextFolderContents, cache, shareId, linkId);
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

    const renameLink = async (
        shareId: string,
        linkId: string,
        parentLinkID: string,
        newName: string,
        type: LinkType
    ) => {
        await renameLinkAsync(debouncedRequest, getLinkKeys, shareId, linkId, parentLinkID, newName, type);
    };

    const createNewFolder = queuedFunction(
        'createNewFolder',
        async (shareId: string, ParentLinkID: string, name: string) => {
            return createNewFolderAsync(
                debouncedRequest,
                getLinkKeys,
                getPrimaryAddressKey,
                shareId,
                ParentLinkID,
                name
            );
        },
        5
    );

    const moveLink = async (shareId: string, ParentLinkID: string, linkId: string) => {
        const result = await moveLinkAsync(
            debouncedRequest,
            getPrimaryAddressKey,
            events.call,
            getLinkMeta,
            getLinkKeys,
            decryptLinkPassphrase,
            shareId,
            ParentLinkID,
            linkId
        );
        return result;
    };

    const moveLinks = async (shareId: string, parentFolderId: string, linkIds: string[]) => {
        const results = await moveLinksAsync(
            moveLink,
            preventLeave,
            cache,
            events.call,
            shareId,
            parentFolderId,
            linkIds
        );
        return results;
    };

    const createShare = (shareId: string, volumeId: string, linkId: string) => {
        return createShareAsync(
            debouncedRequest,
            cache,
            shareId,
            volumeId,
            linkId,
            'New Share',
            LinkType.FILE,
            getPrimaryAddressKey,
            getLinkMeta,
            getLinkKeys
        );
    };

    const deleteChildrenLinks = async (shareId: string, parentLinkId: string, linkIds: string[]) => {
        return deleteChildrenLinksAsync(
            shareId,
            parentLinkId,
            linkIds,
            debouncedRequest,
            cache,
            events.callAll,
            preventLeave
        );
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
        getShareMetaShort,
        renameLink,
        createNewFolder,
        fetchAllFolderPages,
        fetchAllFolderPagesWithLoader,
        decryptLinkPassphrase,
        createShare,
        moveLink,
        moveLinks,
        deleteChildrenLinks,
    };
}

export default useDrive;
