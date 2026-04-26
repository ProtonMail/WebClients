import { useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@proton/atoms/Button/Button';
import {
    type ModalStateReturnObj,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    useModalStateObject,
} from '@proton/components';
import { getDriveForPhotos } from '@proton/drive/index';
import { loadThumbnail, useThumbnail } from '@proton/drive/modules/thumbnails';
import { IcAlbumFolder } from '@proton/icons/icons/IcAlbumFolder';
import { IcPlusCircle } from '@proton/icons/icons/IcPlusCircle';

import { useAlbumProgressStore } from '../../zustand/photos/addToAlbumProgress.store';
import { enqueueAdditionalInfo } from '../PhotosWithAlbums/loaders/loadAdditionalInfo';
import { loadAllAlbums } from '../loaders/loadAlbums';
import { useAlbumsStore } from '../useAlbums.store';
import { usePhotosStore } from '../usePhotos.store';
import { CreateAlbumModal } from './CreateAlbumModal';

import './AlbumPhotoSelection.scss';

const getAltText = (name: string) => `${c('Label').t`Album`} - ${name}`;

const AlbumSquare = ({
    nodeUid,
    loading,
    disabled,
    onClick,
}: {
    nodeUid: string;
    loading: boolean;
    disabled: boolean;
    onClick: (nodeUid: string) => void;
}) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const albumProgress = useAlbumProgressStore();

    const { coverNodeUid, photoCount, name } = useAlbumsStore(
        useShallow((state) => {
            const album = state.albums.get(nodeUid);

            return {
                coverNodeUid: album?.coverNodeUid,
                photoCount: album?.photoCount,
                name: album?.name,
            };
        })
    );

    const coverPhoto = usePhotosStore(
        useShallow((state) => {
            const item = coverNodeUid && state.getPhotoItem(coverNodeUid);
            if (!item || item.additionalInfo === undefined) {
                return undefined;
            }
            return { activeRevisionUid: item.additionalInfo.activeRevisionUid };
        })
    );

    const thumbnail = useThumbnail(coverPhoto?.activeRevisionUid);
    const thumbUrl = thumbnail?.hdUrl || thumbnail?.sdUrl;

    useEffect(function observeViewport() {
        const element = ref.current;
        if (!element) {
            return;
        }
        let timeout: ReturnType<typeof setTimeout>;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    timeout = setTimeout(() => {
                        setIsVisible(true);
                        observer.disconnect();
                    }, 100);
                } else {
                    clearTimeout(timeout);
                }
            },
            { rootMargin: '150px' }
        );
        observer.observe(element);
        return () => {
            observer.disconnect();
            clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        if (!isVisible || !coverNodeUid) {
            return;
        }
        if (!coverPhoto?.activeRevisionUid) {
            enqueueAdditionalInfo(coverNodeUid, () => Boolean(ref.current));
        } else {
            loadThumbnail(getDriveForPhotos(), {
                nodeUid: coverNodeUid,
                revisionUid: coverPhoto.activeRevisionUid,
                shouldLoad: () => Boolean(ref.current),
                thumbnailTypes: ['sd', 'hd'],
            });
        }
    }, [isVisible, coverNodeUid, coverPhoto?.activeRevisionUid]);

    let addPhotosProgressText = '';
    if (albumProgress.status === 'in-progress') {
        addPhotosProgressText = c('Label').t`${albumProgress.added} of ${albumProgress.total}`;
    }
    const shouldShowLoading = loading && albumProgress.status !== 'done';

    if (!name || !photoCount) {
        return null;
    }
    return (
        <li key={nodeUid} ref={ref}>
            <Button
                className="relative flex flex-nowrap items-center justify-start gap-2 album-photo-selection"
                onClick={() => onClick(nodeUid)}
                disabled={disabled}
                loading={shouldShowLoading}
                shape="ghost"
                title={c('Action').ngettext(
                    msgid`Add to "${name}" (${photoCount} photo)`,
                    `Add to "${name}" (${photoCount} photos)`,
                    photoCount
                )}
                aria-label={c('Action').ngettext(
                    msgid`Add to "${name}" (${photoCount} photo)`,
                    `Add to "${name}" (${photoCount} photos)`,
                    photoCount
                )}
            >
                {thumbUrl ? (
                    <img
                        data-testid="albums-card-thumbnail"
                        src={thumbUrl}
                        alt={getAltText(name)}
                        className="object-cover w-custom h-custom rounded overflow-hidden shrink-0"
                        style={{
                            '--w-custom': '2.5rem',
                            '--h-custom': '2.5rem',
                        }}
                    />
                ) : (
                    <div
                        className="object-cover w-custom h-custom rounded overflow-hidden flex justify-center items-center bg-strong p-1 shrink-0"
                        style={{
                            '--w-custom': '2.5rem',
                            '--h-custom': '2.5rem',
                        }}
                    >
                        <IcAlbumFolder />
                    </div>
                )}
                <span className="grow-2 text-left text-ellipsis">{name}</span>
                {shouldShowLoading && addPhotosProgressText && (
                    <span className="grow-2 text-right">{addPhotosProgressText}</span>
                )}
                {!loading && <span className="color-weak text-tabular-nums">{photoCount}</span>}
            </Button>
        </li>
    );
};

const AlbumSquareList = ({
    nodeUids,
    activeAlbumUid,
    onSelectAlbum,
}: {
    nodeUids: string[];
    activeAlbumUid: string | undefined;
    onSelectAlbum: (nodeUid: string) => void;
}) => (
    <ul className="unstyled mt-0">
        {nodeUids.map((nodeUid) => (
            <AlbumSquare
                key={nodeUid}
                nodeUid={nodeUid}
                loading={activeAlbumUid === nodeUid}
                disabled={!!activeAlbumUid && activeAlbumUid !== nodeUid}
                onClick={onSelectAlbum}
            />
        ))}
    </ul>
);

export const AddAlbumPhotosModal = ({
    photosNodeUids,
    addAlbumPhotosModal,
    onCreateAlbumWithPhotos,
    onAddAlbumPhotos,
    share,
}: {
    addAlbumPhotosModal: ModalStateReturnObj;
    onCreateAlbumWithPhotos: (name: string, photoNodeUids: string[]) => Promise<void>;
    onAddAlbumPhotos: (albumNodeUid: string, photoNodeUids: string[]) => Promise<void>;
    photosNodeUids: string[];
    share: boolean;
}) => {
    const { modalProps, openModal, render } = addAlbumPhotosModal;
    const createAlbumModal = useModalStateObject();
    const { albumsUids, albumsMap } = useAlbumsStore(
        useShallow((state) => ({ albumsUids: state.albumsUids, albumsMap: state.albums }))
    );
    const recentUids = new Set(albumsUids.slice(0, 2));
    const sharedAlbumsUids = albumsUids.filter((uid) => albumsMap.get(uid)?.isShared);
    const notSharedAlbumsUids = albumsUids.filter((uid) => !albumsMap.get(uid)?.isShared && !recentUids.has(uid));

    const [activeAlbumUid, setActiveAlbumUid] = useState<string | undefined>();

    const photoCount = photosNodeUids.length;
    useEffect(
        function loadAlbumsInAddPhotosModal() {
            if (!render) {
                return;
            }
            const abortController = new AbortController();
            void loadAllAlbums(abortController.signal);
            return function abortLoadAlbums() {
                abortController.abort();
            };
        },
        [render]
    );

    const handleSelectAlbum = async (nodeUid: string) => {
        setActiveAlbumUid(nodeUid);
        await onAddAlbumPhotos(nodeUid, photosNodeUids);
        setActiveAlbumUid(undefined);
        openModal(false);
    };

    return (
        <>
            {render && (
                <ModalTwo {...modalProps} as="form" size="small">
                    <ModalTwoHeader
                        closeButtonProps={{
                            disabled: !!activeAlbumUid,
                        }}
                        title={
                            share
                                ? c('Heading').ngettext(
                                      msgid`Share ${photoCount} photo via`,
                                      `Share ${photoCount} photos via`,
                                      photoCount
                                  )
                                : c('Heading').ngettext(
                                      msgid`Add ${photoCount} photo to`,
                                      `Add ${photoCount} photos to`,
                                      photoCount
                                  )
                        }
                    />
                    <ModalTwoContent className="max-h-custom" style={{ '--max-h-custom': '21.25rem' }}>
                        <Button
                            disabled={!!activeAlbumUid}
                            className="relative flex items-center gap-2 album-photo-selection"
                            onClick={() => {
                                createAlbumModal.openModal(true);
                                openModal(false);
                            }}
                            shape="ghost"
                            aria-label={c('Action').ngettext(
                                msgid`Add ${photoCount} photo to a new album`,
                                `Add ${photoCount} photos to a new album`,
                                photoCount
                            )}
                        >
                            <span
                                className="block w-custom h-custom rounded overflow-hidden bg-strong flex items-center justify-center"
                                style={{
                                    '--w-custom': '2.5rem',
                                    '--h-custom': '2.5rem',
                                }}
                            >
                                <IcPlusCircle />
                            </span>
                            {share ? c('Action').t`New shared album` : c('Action').t`New album`}
                        </Button>
                        {!!albumsUids.length && (
                            <>
                                {!share && albumsUids[0] && (
                                    <>
                                        <h2 className="text-rg color-weak mt-4 mb-0">{c('Heading').t`Recent`}</h2>
                                        <ul className="unstyled mt-0">
                                            <AlbumSquare
                                                loading={activeAlbumUid === albumsUids[0]}
                                                disabled={!!activeAlbumUid && activeAlbumUid !== albumsUids[0]}
                                                nodeUid={albumsUids[0]}
                                                onClick={handleSelectAlbum}
                                            />
                                            {albumsUids[1] && (
                                                <AlbumSquare
                                                    loading={activeAlbumUid === albumsUids[1]}
                                                    disabled={!!activeAlbumUid && activeAlbumUid !== albumsUids[1]}
                                                    nodeUid={albumsUids[1]}
                                                    onClick={handleSelectAlbum}
                                                />
                                            )}
                                        </ul>
                                    </>
                                )}
                                {share && !!sharedAlbumsUids.length && (
                                    <>
                                        <h2 className="text-rg color-weak mt-4 mb-0">{c('Heading')
                                            .t`Add to shared album`}</h2>
                                        <AlbumSquareList
                                            nodeUids={sharedAlbumsUids}
                                            activeAlbumUid={activeAlbumUid}
                                            onSelectAlbum={handleSelectAlbum}
                                        />
                                    </>
                                )}
                                {!!notSharedAlbumsUids.length && (
                                    <>
                                        <h2 className="text-rg color-weak mt-4 mb-0">{c('Heading').t`All albums`}</h2>
                                        <AlbumSquareList
                                            nodeUids={notSharedAlbumsUids}
                                            activeAlbumUid={activeAlbumUid}
                                            onSelectAlbum={handleSelectAlbum}
                                        />
                                    </>
                                )}
                            </>
                        )}
                    </ModalTwoContent>
                </ModalTwo>
            )}
            {createAlbumModal.render && (
                <CreateAlbumModal
                    share={share}
                    createAlbumModal={createAlbumModal}
                    createAlbum={(name) => {
                        return onCreateAlbumWithPhotos(name, photosNodeUids);
                    }}
                />
            )}
        </>
    );
};
