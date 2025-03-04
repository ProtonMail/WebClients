import type { FC } from 'react';
import React, { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Icon, Loader, useAppTitle, useModalStateObject } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useLinkSharingModal } from '../../components/modals/ShareLinkModal/ShareLinkModal';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import useNavigate from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { AlbumTag, useThumbnailsDownload } from '../../store';
import { sendErrorReport } from '../../utils/errorHandling';
import { useCreateAlbum, useRenameAlbum } from '../PhotosActions/Albums';
import { CreateAlbumModal } from '../PhotosModals/CreateAlbumModal';
import { RenameAlbumModal } from '../PhotosModals/RenameAlbumModal';
import type { DecryptedAlbum } from '../PhotosStore/PhotosWithAlbumsProvider';
import { usePhotosWithAlbumsView } from '../PhotosStore/usePhotosWithAlbumView';
import { AlbumsGrid } from './AlbumsGrid';
import { EmptyAlbums } from './EmptyAlbums';
import { AlbumsTags, type AlbumsTagsProps } from './components/Tags';
import { PhotosWithAlbumsToolbar, ToolbarLeftActionsGallery } from './toolbar/PhotosWithAlbumsToolbar';

import './BannerInvite.scss';

// TODO: Move in separate file once it's completed
const filterAlbums = (albums: DecryptedAlbum[], tag: AlbumTag): DecryptedAlbum[] => {
    if (tag === AlbumTag.Shared) {
        return albums.filter((album) => album.isShared);
    }
    if (tag === AlbumTag.MyAlbums) {
        // TODO: Reverse of Shared With Me (everything else)
        return albums;
    }
    if (tag === AlbumTag.SharedWithMe) {
        // TODO: Shared With Me (comes from Api Call)
        return albums;
    }
    return albums;
};

export const AlbumsView: FC = () => {
    useAppTitle(c('Title').t`Albums`);
    const { volumeId, shareId, linkId, albums, isPhotosLoading, loadPhotoLink, requestDownload, refreshAlbums } =
        usePhotosWithAlbumsView();

    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(LayoutSetting.Grid, isPhotosLoading);
    const createAlbumModal = useModalStateObject();
    const renameAlbumModal = useModalStateObject();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const createAlbum = useCreateAlbum();
    const renameAlbum = useRenameAlbum();
    const [renameAlbumLinkId, setRenameAlbumLinkId] = useState<string>('');

    const thumbnails = useThumbnailsDownload();
    const { navigateToPhotos, navigateToAlbum, navigateToAlbums } = useNavigate();
    // TODO: Move tag selection to specific hook
    const [selectedTags, setSelectedTags] = useState<AlbumsTagsProps['selectedTags']>([AlbumTag.All]);

    const handleItemRender = useCallback(
        (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
            incrementItemRenderedCounter();
            loadPhotoLink(itemLinkId, domRef);
        },
        [incrementItemRenderedCounter, loadPhotoLink]
    );

    const handleItemRenderLoadedLink = (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
        if (shareId) {
            thumbnails.addToDownloadQueue(shareId, itemLinkId, undefined, domRef);
        }
    };

    const showBannerInvite = false; // TO DO
    const peopleInvite = 'Doc Brown'; // To replace
    const emailInvite = 'doc.brown@proton.me'; // To replace
    const albumName = 'Back to Hill Valley'; // To replace
    // translator: please keep **${albumName}** so album name is properly put in bold. Full sentence example is: Doc Brown (doc.brown@proton.me) invited you to join **Back to Hill Valley**)
    const inviteText = getBoldFormattedText(
        c('Info').t`${peopleInvite} (${emailInvite}) invited you to join **${albumName}**`
    );

    const onCreateAlbum = useCallback(
        async (name: string) => {
            if (!shareId || !linkId || !volumeId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                const albumLinkId = await createAlbum(abortSignal, volumeId, shareId, linkId, name);
                navigateToAlbum(albumLinkId);
            } catch (e) {
                console.error('album creation failed', e);
            }
        },
        [shareId, linkId, createAlbum, navigateToAlbum]
    );

    const onRenameAlbum = useCallback(
        async (name: string) => {
            if (!shareId || !volumeId || !renameAlbumLinkId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                await renameAlbum(abortSignal, volumeId, shareId, renameAlbumLinkId, name);
                setRenameAlbumLinkId('');
                refreshAlbums();
            } catch (e) {
                sendErrorReport(e);
            }
        },
        [shareId, volumeId, renameAlbumLinkId, renameAlbum]
    );

    const isAlbumsEmpty = albums.length === 0;
    const filteredAlbums = filterAlbums(albums, selectedTags[0]);

    if (!shareId || !linkId || isPhotosLoading) {
        return <Loader />;
    }

    return (
        <>
            {linkSharingModal}

            <ToolbarRow
                withBorder={false}
                withPadding={false}
                className="m-2 toolbar-row--no-responsive"
                titleArea={
                    <>
                        <ToolbarLeftActionsGallery
                            onGalleryClick={navigateToPhotos}
                            onAlbumsClick={navigateToAlbums}
                            isLoading={isPhotosLoading}
                            selection={'albums'}
                        />
                    </>
                }
                toolbar={
                    <PhotosWithAlbumsToolbar
                        shareId={shareId}
                        linkId={linkId}
                        data={albums}
                        selectedItems={[]}
                        requestDownload={requestDownload}
                        uploadDisabled={true}
                        tabSelection={'albums'}
                        createAlbumModal={createAlbumModal}
                    />
                }
            />

            {!isAlbumsEmpty && (
                <AlbumsTags
                    selectedTags={selectedTags}
                    tags={[AlbumTag.All, AlbumTag.MyAlbums, AlbumTag.Shared, AlbumTag.SharedWithMe]}
                    onTagSelect={setSelectedTags}
                />
            )}

            {showBannerInvite && (
                <div className="banner-invite">
                    <div className="banner-invite-inner border border-info rounded m-2 py-1 px-2 flex flex-row flex-nowrap items-center *:min-size-auto">
                        <div className="flex-1 flex flex-nowrap flex-row items-start py-0.5">
                            <span
                                className="rounded-full custom-bg shrink-0 mr-2 p-1 ratio-square flex"
                                style={{ '--custom-bg': 'var(--signal-info-minor-1)' }}
                            >
                                <Icon name="album" className="m-auto" />
                            </span>
                            <span className="mt-0.5">{inviteText}</span>
                        </div>
                        <span className="shrink-0 flex gap-2 py-0.5">
                            <Button shape="ghost" color="norm">
                                {c('Action').t`Decline`}
                            </Button>
                            <Button shape="solid" color="norm" loading={true}>
                                {c('Action').t`Join album`}
                            </Button>
                        </span>
                    </div>
                </div>
            )}

            {isAlbumsEmpty ? (
                <>
                    <EmptyAlbums createAlbumModal={createAlbumModal} />
                </>
            ) : (
                <AlbumsGrid
                    data={filteredAlbums}
                    onItemRender={handleItemRender}
                    onItemRenderLoadedLink={handleItemRenderLoadedLink}
                    isLoading={false} // TODO: Get Albums loading status
                    onItemClick={(linkId) => {
                        navigateToAlbum(linkId);
                    }}
                    onItemShare={(linkId) => {
                        showLinkSharingModal({ shareId, linkId });
                    }}
                    onItemRename={(linkId) => {
                        setRenameAlbumLinkId(linkId);
                        renameAlbumModal.openModal(true);
                    }}
                />
            )}

            <CreateAlbumModal createAlbumModal={createAlbumModal} createAlbum={onCreateAlbum} />
            {renameAlbumLinkId && (
                <RenameAlbumModal
                    name={filteredAlbums.find((album) => album.linkId === renameAlbumLinkId)?.name}
                    renameAlbumModal={renameAlbumModal}
                    renameAlbum={onRenameAlbum}
                />
            )}
        </>
    );
};
