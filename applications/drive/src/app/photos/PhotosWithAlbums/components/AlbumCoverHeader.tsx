import { fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button, Tooltip, UserAvatar } from '@proton/atoms';
import { Icon } from '@proton/components';
import { useContactEmails } from '@proton/mail/contactEmails/hooks';
import { dateLocale } from '@proton/shared/lib/i18n';
import folderImages from '@proton/styles/assets/img/drive/folder-images.svg';
import useFlag from '@proton/unleash/useFlag';

import { getContactNameAndEmail } from '../../../components/modals/ShareLinkModal/DirectSharing/DirectSharingListing';
import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';
import { PhotosAddAlbumPhotosButton } from '../toolbar/PhotosAddAlbumPhotosButton';
import { AlbumMembers } from './AlbumMembers';

interface AlbumCoverHeaderProps {
    album: DecryptedAlbum;
    onShare: () => void;
    shareId: string;
    linkId: string;
    photoCount: number;
    onAddAlbumPhotos: () => void;
}

export const AlbumCoverHeader = ({
    album,
    shareId,
    linkId,
    photoCount,
    onShare,
    onAddAlbumPhotos,
}: AlbumCoverHeaderProps) => {
    const driveAlbumsDisabled = useFlag('DriveAlbumsDisabled');
    const formattedDate = new Intl.DateTimeFormat(dateLocale.code, {
        dateStyle: 'long',
    }).format(fromUnixTime(album.createTime));
    const [user] = useUser();
    const [contactEmails] = useContactEmails();
    // signature email should always be defined, except in anonymous case, not supported yet in Albums
    const signatureEmail = album.signatureEmail || album.nameSignatureEmail || user.Email;
    const { contactName, contactEmail } = getContactNameAndEmail(signatureEmail, contactEmails);
    const displayName = user.DisplayName || user.Name;
    const showAddToAlbumButton = album.permissions.isOwner || album.permissions.isAdmin || album.permissions.isEditor;
    const sharedByNameOrEmail = contactName || contactEmail;

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
                    className="bg-weak rounded w-full md:w-1/3 flex h-custom object-cover lg:max-w-custom"
                    style={{
                        '--h-custom': '14rem',
                        '--lg-max-w-custom': 'min(32rem, 25vw)',
                        // min between 512px and 1/4 of viewport width: okay for global and text zooms, also for super large viewports
                    }}
                    data-testid="cover-image"
                />
            ) : (
                <span
                    className="bg-weak rounded w-full md:w-1/3 flex h-custom object-cover lg:max-w-custom"
                    style={{
                        '--h-custom': '14rem',
                        '--lg-max-w-custom': 'min(32rem, 25vw)',
                    }}
                    data-testid="cover-image"
                >
                    <img src={folderImages} alt="" className="m-auto" />
                </span>
            )}

            <div className="flex flex-column flex-nowrap mx-auto shrink-0 flex-1" data-testid="cover-info">
                <h1 className="text-bold h2 text-ellipsis" title={album.name}>
                    {album.name}
                </h1>
                <p className="color-weak mb-2 mt-1">
                    {formattedDate}
                    <span className="ml-1">
                        ⋅ {c('Info').ngettext(msgid`${photoCount} item`, `${photoCount} items`, photoCount)}
                    </span>
                </p>
                <div className="flex flex-wrap flex-row gap-2" data-testid="cover-options">
                    {album.permissions.isAdmin && (
                        <Tooltip title={displayName}>
                            <UserAvatar name={displayName} data-testid="user-avatar" />
                        </Tooltip>
                    )}

                    {album.permissions.isAdmin && <AlbumMembers shareId={shareId} linkId={linkId} onShare={onShare} />}

                    {album.permissions.isAdmin && (
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

                    {!album.permissions.isAdmin && (
                        <span className="color-weak mb-2 mt-1">
                            {c('Info').t`Shared by `}
                            <b>{sharedByNameOrEmail}</b>
                        </span>
                    )}

                    {photoCount === 0 && !driveAlbumsDisabled && (
                        <>{showAddToAlbumButton && <PhotosAddAlbumPhotosButton onClick={onAddAlbumPhotos} />}</>
                    )}
                </div>
            </div>
        </div>
    );
};
