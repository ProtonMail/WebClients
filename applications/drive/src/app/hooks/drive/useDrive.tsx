import React from 'react';
import { OpenPGPKey } from 'pmcrypto';
import { useModals, usePreventLeave } from 'react-components';
import useDriveCrypto from './useDriveCrypto';
import { LinkMeta, LinkType } from '../../interfaces/link';
import { useDriveCache, LinkKeys } from '../../components/DriveCache/DriveCacheProvider';
import { DEFAULT_SORT_PARAMS } from '../../constants';
import OnboardingModal from '../../components/OnboardingModal/OnboardingModal';
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
} from '../../utils/drive/drive';

function useDrive() {
    const cache = useDriveCache();
    const queuedFunction = useQueuedFunction();
    const { createModal } = useModals();
    const { getPrimaryAddressKey, getVerificationKeys } = useDriveCrypto();
    const debouncedRequest = useDebouncedRequest();
    const { preventLeave } = usePreventLeave();
    const { events } = useEvents();

    const getShareMeta = async (shareId: string) => {
        const shareMeta = await getShareMetaAsync(debouncedRequest, cache, events.subscribe, shareId);
        return shareMeta;
    };

    const initDrive = async () => {
        const createOnboardingModal = () => createModal(<OnboardingModal />);
        const shareMeta = await initDriveAsync(
            debouncedRequest,
            getPrimaryAddressKey,
            createOnboardingModal,
            events.subscribe,
            cache
        );

        return shareMeta;
    };

    const getShareKeys = async (shareId: string) => {
        const keys = await getShareKeysAsync(debouncedRequest, getVerificationKeys, cache, events.subscribe, shareId);
        return keys;
    };

    const decryptLink = async (meta: LinkMeta, privateKey: OpenPGPKey): Promise<LinkMeta> => {
        const linkMeta = await decryptLinkAsync(meta, privateKey);
        return linkMeta;
    };

    const getLinkKeys = async (shareId: string, linkId: string, config: FetchLinkConfig = {}): Promise<LinkKeys> => {
        const keys = await getLinkKeysAsync(
            debouncedRequest,
            getVerificationKeys,
            cache,
            events.subscribe,
            shareId,
            linkId,
            config
        );
        return keys;
    };

    const getLinkMeta = async (shareId: string, linkId: string, config: FetchLinkConfig = {}): Promise<LinkMeta> => {
        const meta = await getLinkMetaAsync(
            debouncedRequest,
            getVerificationKeys,
            cache,
            events.subscribe,
            shareId,
            linkId,
            config
        );
        return meta;
    };

    const getFoldersOnlyMetas = async (shareId: string, linkId: string, fetchNextPage = false) => {
        const linkMetas = await getFoldersOnlyMetasAsync(
            debouncedRequest,
            getVerificationKeys,
            cache,
            events.subscribe,
            shareId,
            linkId,
            fetchNextPage
        );
        return linkMetas;
    };

    const fetchNextFolderContents = async (shareId: string, linkId: string, sortParams = DEFAULT_SORT_PARAMS) => {
        await fetchNextFolderContentsAsync(
            debouncedRequest,
            getVerificationKeys,
            cache,
            events.subscribe,
            shareId,
            linkId,
            sortParams
        );
    };

    const fetchAllFolderPages = async (shareId: string, linkId: string) => {
        await fetchAllFolderPagesAsync(debouncedRequest, getVerificationKeys, cache, events.subscribe, shareId, linkId);
    };

    const renameLink = async (
        shareId: string,
        linkId: string,
        parentLinkID: string,
        newName: string,
        type: LinkType
    ) => {
        await renameLinkAsync(
            debouncedRequest,
            getVerificationKeys,
            cache,
            events.subscribe,
            shareId,
            linkId,
            parentLinkID,
            newName,
            type
        );
    };

    const createNewFolder = queuedFunction(
        'createNewFolder',
        async (shareId: string, ParentLinkID: string, name: string) => {
            return createNewFolderAsync(
                debouncedRequest,
                getVerificationKeys,
                getPrimaryAddressKey,
                cache,
                events.subscribe,
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
            getVerificationKeys,
            getPrimaryAddressKey,
            cache,
            events.subscribe,
            events.call,
            shareId,
            ParentLinkID,
            linkId
        );
        return result;
    };

    const moveLinks = async (shareId: string, parentFolderId: string, linkIds: string[]) => {
        const results = await moveLinksAsync(
            debouncedRequest,
            getVerificationKeys,
            getPrimaryAddressKey,
            preventLeave,
            cache,
            events.subscribe,
            events.call,
            shareId,
            parentFolderId,
            linkIds
        );
        return results;
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
        events,
    };
}

export default useDrive;
