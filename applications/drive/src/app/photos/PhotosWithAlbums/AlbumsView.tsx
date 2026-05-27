import type { FC } from 'react';
import { useCallback, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle, useModalStateObject, useNotifications } from '@proton/components';
import { getDriveForPhotos } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { getNotificationsManager } from '@proton/drive/modules/notifications';

import useNavigate from '../../legacy/hooks/drive/useNavigate';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { RenameAlbumModal } from '../PhotosModals/RenameAlbumModal';
import { usePhotoLayoutStore } from '../layout.store';
import { refreshAlbumMetadata } from '../loaders/loadAlbum';
import { type AlbumItem, useAlbumsStore } from '../useAlbums.store';
import { AlbumsGrid } from './AlbumsGrid';
import { AlbumsInvitations } from './AlbumsInvitations';
import { EmptyAlbums } from './EmptyAlbums';
import { EmptyTagView } from './EmptyTagView';
import { AlbumsTags, type AlbumsTagsProps } from './components/Tags';
import { AlbumTag } from './types';

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

    const { modals } = usePhotoLayoutStore(
        useShallow((state) => ({
            modals: state.modals,
        }))
    );
    const renameAlbumModal = useModalStateObject();
    const [renameAlbumNodeUid, setRenameAlbumNodeUid] = useState<string>('');
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
        async (albumNodeUid: string, { saveToTimeline, force }: { saveToTimeline: boolean; force: boolean }) => {
            const album = useAlbumsStore.getState().albums.get(albumNodeUid);
            if (!album) {
                return;
            }
            await getDriveForPhotos().deleteAlbum(albumNodeUid, {
                saveToTimeline,
                force,
            });
            await getBusDriver().emit(
                { type: BusDriverEventName.DELETED_NODES, uids: [albumNodeUid] },
                getDriveForPhotos()
            );

            const albumName = album.name;
            createNotification({
                text: c('Info').t`${albumName} has been successfully deleted`,
                preWrap: true,
            });
        },
        [createNotification]
    );

    // For delete album we do the happy path and just compare with photos you have in cache.
    // In most cases, if user have all the photos in his library will mean there are no direct children inside the album
    // There is a fallback in the modal in case BE detect that some items are direct children of the album
    const onDeleteAlbum = useCallback(
        async (albumNodeUid: string) => {
            const album = useAlbumsStore.getState().albums.get(albumNodeUid);
            if (!album) {
                return;
            }
            void modals.deleteAlbum?.({
                name: album.name,
                deleteAlbum: ({ saveToTimeline, force }) =>
                    // childLinkIds are from BE, so this is a better source of truth compare to missingPhotosIds
                    handleDeleteAlbum(albumNodeUid, { saveToTimeline, force }),
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
    if (isAlbumsLoading && albums.length === 0) {
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
