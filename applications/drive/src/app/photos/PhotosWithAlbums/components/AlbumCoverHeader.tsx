import { fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useUser } from '@proton/account/user/hooks';
import { Button, UserAvatar } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import { dateLocale } from '@proton/shared/lib/i18n';
import useFlag from '@proton/unleash/useFlag';

import { type OnFileSkippedSuccessCallbackData, type OnFileUploadSuccessCallbackData } from '../../../store';
import { useAlbumsPhotosStore } from '../../../zustand/photos/albumsPhotos.store';
import { unleashVanillaStore } from '../../../zustand/unleash/unleash.store';
import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';
import { PhotosAddAlbumPhotosButton } from '../toolbar/PhotosAddAlbumPhotosButton';
import { PhotosUploadButton } from '../toolbar/PhotosUploadButton';
import { AlbumMembers } from './AlbumMembers';

interface AlbumCoverHeaderProps {
    album: DecryptedAlbum;
    onShare: () => void;
    shareId: string;
    linkId: string;
    uploadLinkId: string;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void;
    onAddAlbumPhotos: () => void;
}

export const AlbumCoverHeader = ({
    album,
    shareId,
    linkId,
    uploadLinkId,
    onFileUpload,
    onFileSkipped,
    onShare,
    onAddAlbumPhotos,
}: AlbumCoverHeaderProps) => {
    const driveAlbumsDisabled = useFlag('DriveAlbumsDisabled');
    const formattedDate = new Intl.DateTimeFormat(dateLocale.code, {
        dateStyle: 'long',
    }).format(fromUnixTime(album.createTime));
    const [user] = useUser();
    const displayName = user.DisplayName || user.Name;
    const isAlbumsWithSharingDisabled = unleashVanillaStore.getState().isEnabled('DriveAlbumsTempDisabledOnRelease');
    const { photosCount } = useAlbumsPhotosStore(
        useShallow((state) => ({
            photosCount: state.albumsPhotosCount[album.linkId] || 0,
        }))
    );

    return (
        <div
            className="flex shrink-0 flex-row gap-4 md:flex-nowrap items-center"
            data-testid="album-gallery-cover-section"
        >
            {album.cachedThumbnailUrl || album.cover?.cachedThumbnailUrl ? (
                <img
                    loading="eager"
                    key={album.cachedThumbnailUrl || album.cover?.cachedThumbnailUrl}
                    src={album.cachedThumbnailUrl || album.cover?.cachedThumbnailUrl}
                    alt=""
                    className="bg-weak rounded w-full md:w-1/3 flex h-custom object-cover"
                    style={{
                        '--h-custom': '14rem',
                    }}
                    data-testid="cover-image"
                />
            ) : (
                <span
                    className="bg-weak rounded w-full md:w-1/3 flex h-custom object-cover"
                    style={{
                        '--h-custom': '14rem',
                    }}
                    data-testid="cover-image"
                >
                    <Icon name="album" className="m-auto" size={6} />
                </span>
            )}

            <div className="flex flex-column flex-nowrap mx-auto shrink-0 flex-1" data-testid="cover-info">
                <h1 className="text-bold h2">{album.name}</h1>
                <p className="color-weak mb-2 mt-1">
                    {formattedDate}
                    <span className="ml-1">
                        ⋅ {c('Info').ngettext(msgid`${photosCount} item`, `${photosCount} items`, photosCount)}
                    </span>
                </p>
                <div className="flex flex-wrap flex-row gap-2" data-testid="cover-options">
                    {!isAlbumsWithSharingDisabled && (
                        <Tooltip title={displayName}>
                            <UserAvatar name={displayName} data-testid="user-avatar" />
                        </Tooltip>
                    )}

                    {!isAlbumsWithSharingDisabled && album.permissions.isAdmin && (
                        <AlbumMembers shareId={shareId} linkId={linkId} onShare={onShare} />
                    )}

                    {!isAlbumsWithSharingDisabled && album.permissions.isAdmin && (
                        <Button
                            color="weak"
                            shape="solid"
                            size="small"
                            className="inline-flex flex-row flex-nowrap items-center"
                            onClick={onShare}
                            data-testid="cover-share"
                        >
                            <Icon name="user-plus" className="mr-2" />
                            {c('Action').t`Share`}
                        </Button>
                    )}

                    {photosCount === 0 && !driveAlbumsDisabled && (
                        <>
                            {album.permissions.isAdmin && <PhotosAddAlbumPhotosButton onClick={onAddAlbumPhotos} />}
                            {!album.permissions.isAdmin && album.permissions.isEditor && (
                                <PhotosUploadButton
                                    type="norm"
                                    shareId={shareId}
                                    linkId={uploadLinkId}
                                    onFileUpload={onFileUpload}
                                    onFileSkipped={onFileSkipped}
                                    data-testid="upload-photos"
                                    isAlbumUpload
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
