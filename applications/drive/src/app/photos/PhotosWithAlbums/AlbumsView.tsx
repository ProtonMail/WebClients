import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom-v5-compat';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle, useModalStateObject, useNotifications } from '@proton/components';
import { getDriveForPhotos, splitNodeUid } from '@proton/drive';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import useNavigate from '../../hooks/drive/useNavigate';
import { getNotificationsManager } from '../../modules/notifications';
import { AlbumTag } from '../../store';
import { useLinksActions } from '../../store/_links';
import { sendErrorReport } from '../../utils/errorHandling';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { usePhotoLayoutStore } from '../../zustand/photos/layout.store';
import { RenameAlbumModal } from '../PhotosModals/RenameAlbumModal';
import { refreshAlbumMetadata } from '../loaders/loadAlbum';
import { type AlbumItem, useAlbumsStore } from '../useAlbums.store';
import { AlbumsGrid } from './AlbumsGrid';
import { AlbumsInvitations } from './AlbumsInvitations';
import { EmptyAlbums } from './EmptyAlbums';
import { EmptyTagView } from './EmptyTagView';
import { AlbumsTags, type AlbumsTagsProps } from './components/Tags';
import type { PhotosLayoutOutletContext } from './layout/PhotosLayout';

import './BannerInvite.scss';

const filterAlbums = (albums: AlbumItem[], tag: AlbumTag): AlbumItem[] => {
    if (tag === AlbumTag.Shared) {
        return albums.filter((album) => album.isShared && album.isOwner);
    }
    if (tag === AlbumTag.MyAlbums) {
        return albums.filter((album) => album.isOwner);
    }
    if (tag === AlbumTag.SharedWithMe) {
        return albums.filter((album) => !album.isOwner);
    }
    return albums;
};

export const AlbumsView: FC = () => {
    useAppTitle(c('Title').t`Albums`);
    const { volumeId, shareId, linkId, deleteAlbum } = useOutletContext<PhotosLayoutOutletContext>();

    const { modals } = usePhotoLayoutStore(
        useShallow((state) => ({
            modals: state.modals,
        }))
    );
    const renameAlbumModal = useModalStateObject();
    const [renameAlbumNodeUid, setRenameAlbumNodeUid] = useState<string>('');
    const { transferPhotoLinks } = useLinksActions();
    const { createNotification } = useNotifications();

    const { albumsUids, albumsMap, isAlbumsLoading } = useAlbumsStore(
        useShallow((state) => ({
            albumsUids: state.albumsUids,
            albumsMap: state.albums,
            isAlbumsLoading: state.isLoadingList,
        }))
    );

    const { navigateToNodeUid, navigateToAlbums } = useNavigate();
    // TODO: Move tag selection to specific hook
    const [selectedTags, setSelectedTags] = useState<AlbumsTagsProps['selectedTags']>([AlbumTag.All]);

    const onRenameAlbum = useCallback(
        async (name: string) => {
            if (!renameAlbumNodeUid) {
                return;
            }
            try {
                // TODO: Move it somewhere else and use busDriver (issue with update condition)
                await getDriveForPhotos().renameNode(renameAlbumNodeUid, name);
                await refreshAlbumMetadata(renameAlbumNodeUid);
                getNotificationsManager().createNotification({
                    type: 'success',
                    text: c('Notitication').t`Album renamed successfully`,
                });
            } catch (e) {
                handleSdkError(e);
            } finally {
                setRenameAlbumNodeUid('');
            }
        },
        [renameAlbumNodeUid]
    );

    const handleDeleteAlbum = useCallback(
        async (
            abortSignal: AbortSignal,
            album: AlbumItem,
            { missingPhotosIds, force }: { missingPhotosIds?: string[]; force: boolean }
        ) => {
            if (!linkId || !volumeId || !shareId) {
                return;
            }
            try {
                if (missingPhotosIds?.length && !force) {
                    await transferPhotoLinks(
                        abortSignal,
                        volumeId,
                        {
                            // TODO: DRVWEB-4974 - use album rootShareId once available in AlbumItem
                            shareId,
                            linkIds: missingPhotosIds,
                            newShareId: shareId,
                            newParentLinkId: linkId,
                        },
                        'delete_album'
                    );
                }
                await deleteAlbum(abortSignal, splitNodeUid(album.nodeUid).nodeId, force);
                const albumName = album.name;
                createNotification({
                    text: c('Info').t`${albumName} has been successfully deleted`,
                    preWrap: true,
                });
            } catch (e) {
                const error = e as {
                    data?: {
                        Code?: number;
                        Details?: {
                            ChildLinkIDs?: string[];
                        };
                    };
                };
                // Error will be catch by the DeleteAlbumModal to show save and delete modal
                if (
                    error.data?.Code === API_CUSTOM_ERROR_CODES.ALBUM_DATA_LOSS &&
                    error.data.Details?.ChildLinkIDs?.length
                ) {
                    throw e;
                }
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [linkId, createNotification, deleteAlbum, transferPhotoLinks, shareId, volumeId]
    );

    // For delete album we do the happy path and just compare with photos you have in cache.
    // In most cases, if user have all the photos in his library will mean there are no direct children inside the album
    // There is a fallback in the modal in case BE detect that some items are direct children of the album
    const onDeleteAlbum = useCallback(
        async (nodeUid: string) => {
            const album = useAlbumsStore.getState().albums.get(nodeUid);
            if (!album) {
                return;
            }
            const abortSignal = new AbortController().signal;
            void modals.deleteAlbum?.({
                name: album.name,
                deleteAlbum: (force, childLinkIds) =>
                    // childLinkIds are from BE, so this is a better source of truth compare to missingPhotosIds
                    handleDeleteAlbum(abortSignal, album, { missingPhotosIds: childLinkIds, force }),
                onDeleted: () => {
                    navigateToAlbums();
                },
            });
        },
        [modals, handleDeleteAlbum, navigateToAlbums]
    );

    const albums = albumsUids.map((uid) => albumsMap.get(uid)).filter((a): a is AlbumItem => a !== undefined);
    const isAlbumsEmpty = !isAlbumsLoading && albums.length === 0;
    const filteredAlbums = filterAlbums(albums, selectedTags[0]);
    const tagCounts: Partial<Record<AlbumTag, number>> = {
        [AlbumTag.All]: albums.length,
        [AlbumTag.MyAlbums]: filterAlbums(albums, AlbumTag.MyAlbums).length,
        [AlbumTag.Shared]: filterAlbums(albums, AlbumTag.Shared).length,
        [AlbumTag.SharedWithMe]: filterAlbums(albums, AlbumTag.SharedWithMe).length,
    };
    if (!volumeId || !shareId || !linkId || (isAlbumsLoading && albums.length === 0)) {
        return <Loader />;
    }

    const isSelectedTagEmtpy = !isAlbumsEmpty && filteredAlbums.length === 0;
    return (
        <>
            {!isAlbumsEmpty && (
                <AlbumsTags
                    selectedTags={selectedTags}
                    tags={[AlbumTag.All, AlbumTag.MyAlbums, AlbumTag.Shared, AlbumTag.SharedWithMe]}
                    onTagSelect={setSelectedTags}
                    counts={tagCounts}
                    loading={isAlbumsLoading}
                />
            )}

            <AlbumsInvitations />
            {isSelectedTagEmtpy && <EmptyTagView tag={selectedTags[0]} />}
            {isAlbumsEmpty && <EmptyAlbums createAlbumModal={modals.createAlbum} />}
            {!isAlbumsEmpty && !isSelectedTagEmtpy && (
                <AlbumsGrid
                    data={filteredAlbums.map((album) => album.nodeUid)}
                    isLoading={isAlbumsLoading}
                    onItemClick={(nodeUid) => {
                        void navigateToNodeUid(nodeUid, getDriveForPhotos());
                    }}
                    onItemShare={(nodeUid) => {
                        modals.linkSharing?.({
                            nodeUid,
                            drive: getDriveForPhotos(),
                        });
                    }}
                    onItemRename={(nodeUid) => {
                        setRenameAlbumNodeUid(nodeUid);
                        renameAlbumModal.openModal(true);
                    }}
                    onItemDelete={onDeleteAlbum}
                />
            )}
            {renameAlbumNodeUid && (
                <RenameAlbumModal
                    initialName={filteredAlbums.find((album) => album.nodeUid === renameAlbumNodeUid)?.name}
                    renameAlbumModal={renameAlbumModal}
                    renameAlbum={onRenameAlbum}
                />
            )}
        </>
    );
};
