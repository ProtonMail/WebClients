import { getUnixTime } from 'date-fns';

import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';
import type { DevicePayload } from '@proton/shared/lib/interfaces/drive/device';
import type { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';
import { type DriveFileRevisionPayload, PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import type {
    ShareExternalInvitationPayload,
    ShareInvitationDetailsPayload,
    ShareInvitationPayload,
} from '@proton/shared/lib/interfaces/drive/invitation';
import type { LinkMeta, LinkSharedUrlInfo } from '@proton/shared/lib/interfaces/drive/link';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import type { ShareMemberPayload, ShareMembershipPayload } from '@proton/shared/lib/interfaces/drive/member';
import type { PhotoPayload } from '@proton/shared/lib/interfaces/drive/photos';
import type { ShareMeta, ShareMetaShort } from '@proton/shared/lib/interfaces/drive/share';
import type { ShareURL as ShareURLPayload, SharedURLInfoPayload } from '@proton/shared/lib/interfaces/drive/sharing';
import type { DriveVolume as DriveVolumePayload } from '@proton/shared/lib/interfaces/drive/volume';

import type { Device } from '../_devices';
import type { DriveEvents } from '../_events';
import type { DecryptedLink, EncryptedLink } from '../_links';
import type { Photo } from '../_photos';
import type { DriveFileRevision } from '../_revisions';
import { ShareType, hasCustomPassword, hasGeneratedPasswordIncluded } from '../_shares';
import type {
    Share,
    ShareExternalInvitation,
    ShareInvitation,
    ShareInvitationDetails,
    ShareMember,
    ShareMembership,
    ShareURL,
    ShareURLLEGACY,
    ShareWithKey,
    SharedUrlInfo,
} from '../_shares';
import { ThumbnailType } from '../_uploads/media';
import type { DriveVolume } from '../_volumes';

// LinkMetaWithShareURL is used when loading shared links.
// We need this to load information about number of accesses.
type LinkMetaWithShareURL = LinkMeta & {
    ShareUrls: (LinkSharedUrlInfo & {
        ShareURL?: ShareURLPayload;
    })[];
};

export function linkMetaToEncryptedLink(link: LinkMetaWithShareURL, shareId: string): EncryptedLink {
    const isDocument = link.Type === LinkType.FILE && isProtonDocsDocument(link.MIMEType);

    const currentUnixTime = getUnixTime(Date.now());
    return {
        linkId: link.LinkID,
        parentLinkId: link.ParentLinkID ?? '',
        type: link.Type,
        // API recognises only file and folder at this moment. In the future,
        // it might include hard- and soft-links, but still, for our case we
        // will differenciate only between files and folders, so we can convert
        // to simple boolean property.
        isFile: link.Type === LinkType.FILE,
        name: link.Name,
        nameSignatureEmail: link.NameSignatureEmail,
        mimeType: link.MIMEType,
        size: isDocument ? link.DocumentProperties?.Size || link.Size : link.Size,
        hash: link.Hash,
        activeRevision: link.FileProperties?.ActiveRevision
            ? {
                  id: link.FileProperties.ActiveRevision.ID,
                  size: link.FileProperties.ActiveRevision.Size,
                  signatureEmail: link.FileProperties.ActiveRevision.SignatureEmail,
                  createTime: link.FileProperties.ActiveRevision.CreateTime,
                  state: link.FileProperties.ActiveRevision.State,
                  manifestSignature: link.FileProperties.ActiveRevision.ManifestSignature,
                  blocs: link.FileProperties.ActiveRevision.Blocks,
                  thumbnail: link.FileProperties.ActiveRevision.ThumbnailURLInfo
                      ? {
                            bareUrl: link.FileProperties.ActiveRevision.ThumbnailURLInfo.BareURL,
                            token: link.FileProperties.ActiveRevision.ThumbnailURLInfo.Token,
                        }
                      : undefined,
                  thumbnails: link.FileProperties.ActiveRevision.Thumbnails.map((Thumbnail) => ({
                      id: Thumbnail.ThumbnailID,
                      type: Thumbnail.Type,
                      hash: Thumbnail.Hash,
                      size: Thumbnail.Size,
                  })),
                  photo: link.FileProperties.ActiveRevision.Photo
                      ? {
                            linkId: link.FileProperties.ActiveRevision.Photo.LinkID,
                            captureTime: link.FileProperties.ActiveRevision.Photo.CaptureTime,
                            contentHash: link.FileProperties.ActiveRevision.Photo.ContentHash ?? undefined,
                            mainPhotoLinkId: link.FileProperties.ActiveRevision.Photo.MainPhotoLinkID ?? undefined,
                            hash: link.FileProperties.ActiveRevision.Photo.Hash ?? undefined,
                            relatedPhotosLinkIds:
                                link.FileProperties.ActiveRevision.Photo.RelatedPhotosLinkIDs ?? undefined,
                        }
                      : undefined,
              }
            : undefined,
        createTime: link.CreateTime,
        metaDataModifyTime: link.ModifyTime,
        trashed: link.Trashed,
        hasThumbnail: !!link.FileProperties?.ActiveRevision?.Thumbnails.length,
        hasHdThumbnail: !!link.FileProperties?.ActiveRevision?.Thumbnails?.find(
            (Thumbnail) => Thumbnail.Type === ThumbnailType.HD_PREVIEW
        ),
        isShared: link.SharingDetails === undefined ? undefined : !!link.SharingDetails,
        shareId: link.SharingDetails?.ShareID,
        rootShareId: shareId,
        shareUrl:
            link.ShareUrls?.length > 0
                ? {
                      id: link.ShareUrls[0].ShareUrlID,
                      token: link.ShareUrls[0].Token,
                      isExpired: link.ShareUrls[0].ExpireTime ? currentUnixTime > link.ShareUrls[0].ExpireTime : false,
                      createTime: link.ShareUrls[0].CreateTime,
                      expireTime: link.ShareUrls[0].ExpireTime,
                      numAccesses: link.ShareUrls[0].NumAccesses,
                  }
                : undefined,
        sharingDetails: link.SharingDetails
            ? {
                  shareId: link.SharingDetails.ShareID,
                  shareUrl: link.SharingDetails.ShareUrl
                      ? {
                            id: link.SharingDetails.ShareUrl.ShareUrlID,
                            token: link.SharingDetails.ShareUrl.Token,
                            isExpired: link.SharingDetails.ShareUrl.ExpireTime
                                ? currentUnixTime > link.SharingDetails.ShareUrl.ExpireTime
                                : false,
                            createTime: link.SharingDetails.ShareUrl.CreateTime,
                            expireTime: link.SharingDetails.ShareUrl.ExpireTime,
                            numAccesses: link.SharingDetails.ShareUrl.NumAccesses,
                        }
                      : undefined,
              }
            : undefined,
        nodeKey: link.NodeKey,
        nodePassphrase: link.NodePassphrase,
        nodePassphraseSignature: link.NodePassphraseSignature,
        nodeHashKey: link.FolderProperties?.NodeHashKey || link.AlbumProperties?.NodeHashKey,
        contentKeyPacket: link.FileProperties?.ContentKeyPacket,
        contentKeyPacketSignature: link.FileProperties?.ContentKeyPacketSignature,
        signatureEmail: link.SignatureEmail,
        xAttr: link.XAttr,
        photoProperties: link.PhotoProperties
            ? {
                  albums: link.PhotoProperties.Albums.map((album) => ({
                      albumLinkId: album.AlbumLinkID,
                      hash: album.Hash,
                      contentHash: album.ContentHash,
                      addedTime: album.AddedTime,
                  })),
                  tags: link.PhotoProperties.Tags,
                  isFavorite: Boolean(
                      PhotoTag.Favorites === link.PhotoProperties.Tags.find((tag) => tag === PhotoTag.Favorites)
                  ),
              }
            : undefined,
        albumProperties: link.AlbumProperties
            ? {
                  nodeHashKey: link.AlbumProperties.NodeHashKey,
                  coverLinkId: link.AlbumProperties.CoverLinkID,
                  photoCount: link.AlbumProperties.PhotoCount,
                  lastActivityTime: link.AlbumProperties.LastActivityTime,
                  locked: link.AlbumProperties.Locked,
              }
            : undefined,
        volumeId: link.VolumeID,
    };
}

export const shareMemberPayloadToShareMember = (shareMember: ShareMemberPayload): ShareMember => {
    return {
        memberId: shareMember.MemberID,
        email: shareMember.Email,
        inviterEmail: shareMember.InviterEmail,
        addressId: shareMember.AddressID,
        createTime: shareMember.CreateTime,
        modifyTime: shareMember.ModifyTime,
        permissions: shareMember.Permissions,
        keyPacketSignature: shareMember.KeyPacketSignature,
        sessionKeySignature: shareMember.SessionKeySignature,
    };
};

export const shareMembershipPayloadToShareMembership = (shareMembership: ShareMembershipPayload): ShareMembership => {
    return {
        memberId: shareMembership.MemberID,
        shareId: shareMembership.ShareID,
        addressId: shareMembership.AddressID,
        addressKeyId: shareMembership.AddressKeyID,
        inviterEmail: shareMembership.Inviter,
        createTime: shareMembership.CreateTime,
        modifyTime: shareMembership.ModifyTime,
        permissions: shareMembership.Permissions,
        state: shareMembership.State,
        keyPacket: shareMembership.KeyPacket,
        keyPacketSignature: shareMembership.KeyPacketSignature,
        sessionKeySignature: shareMembership.SessionKeySignature,
        unlockable: shareMembership.Unlockable,
    };
};

export function shareMetaShortToShare(share: ShareMetaShort): Share {
    return {
        shareId: share.ShareID,
        rootLinkId: share.LinkID,
        volumeId: share.VolumeID,
        creator: share.Creator,
        isLocked: share.Locked,
        isDefault: share.Type === ShareType.default,
        possibleKeyPackets: (share.PossibleKeyPackets || []).map(({ KeyPacket }) => KeyPacket),
        type: share.Type,
        linkType: share.LinkType,
        state: share.State,
        createTime: share.CreateTime,
    };
}

export function shareMetaToShareWithKey(share: ShareMeta): ShareWithKey {
    return {
        ...shareMetaShortToShare(share),
        addressId: share.AddressID || share.Memberships[0].AddressID,
        key: share.Key,
        passphrase: share.Passphrase,
        passphraseSignature: share.PassphraseSignature,
        rootLinkRecoveryPassphrase: share.RootLinkRecoveryPassphrase,
        memberships: share.Memberships.map((membership) => shareMembershipPayloadToShareMembership(membership)),
    };
}

export function driveEventsResultToDriveEvents({ EventID, Events, Refresh }: DriveEventsResult): DriveEvents {
    return {
        eventId: EventID,
        events: Events.map((event) => ({
            eventType: event.EventType,
            data: event.Data
                ? {
                      externalInvitationSignup: event.Data.ExternalInvitationSignup,
                  }
                : undefined,
            // ContextShareID is guaranteed to be on the event for all types
            // besides delete (after link is deleted, it is not possible to
            // find the share it was part of). For delete operation, it is
            // fine to keep rootShareId empty as its only for deleting data
            // from cache. In future, once the cache is volume oriented, it
            // will not be a problem, because we will always know proper
            // volume ID.
            encryptedLink:
                event.EventType === EVENT_TYPES.DELETE
                    ? linkMetaToEncryptedLink(event.Link, '')
                    : linkMetaToEncryptedLink(event.Link, event.ContextShareID),
            originShareId: event.EventType === EVENT_TYPES.DELETE ? undefined : event.FromContextShareID,
        })),
        refresh: Refresh !== 0,
    };
}

export const deviceInfoToDevices = (info: DevicePayload): Device => {
    return {
        id: info.Device.DeviceID,
        volumeId: info.Device.VolumeID,
        shareId: info.Share.ShareID,
        name: info.Share.Name,
        modificationTime: info.Device.ModifyTime,
        linkId: info.Share.LinkID,
        haveLegacyName: !!info.Share.Name,
    };
};

export const shareUrlPayloadToShareUrl = (shareUrl: ShareURLPayload): ShareURL => {
    return {
        shareId: shareUrl.ShareID,
        shareUrlId: shareUrl.ShareURLID,
        expirationTime: shareUrl.ExpirationTime,
        creatorEmail: shareUrl.CreatorEmail,
        password: shareUrl.Password,
        flags: shareUrl.Flags,
        token: shareUrl.Token,
        publicUrl: shareUrl.PublicUrl,
        sharePassphraseKeyPacket: shareUrl.SharePassphraseKeyPacket,
        sharePasswordSalt: shareUrl.SharePasswordSalt,
        hasGeneratedPasswordIncluded: hasGeneratedPasswordIncluded({ flags: shareUrl.Flags }),
        numAccesses: shareUrl.NumAccesses,
        urlPasswordSalt: shareUrl.UrlPasswordSalt,
        srpVerifier: shareUrl.SRPVerifier,
        srpModulusID: shareUrl.SRPModulusID,
        maxAccesses: shareUrl.MaxAccesses,
        permissions: shareUrl.Permissions,
    };
};

export const shareUrlPayloadToShareUrlLEGACY = (shareUrl: ShareURLPayload): ShareURLLEGACY => {
    return {
        shareId: shareUrl.ShareID,
        shareUrlId: shareUrl.ShareURLID,
        expirationTime: shareUrl.ExpirationTime,
        creatorEmail: shareUrl.CreatorEmail,
        password: shareUrl.Password,
        flags: shareUrl.Flags,
        token: shareUrl.Token,
        publicUrl: shareUrl.PublicUrl,
        sharePassphraseKeyPacket: shareUrl.SharePassphraseKeyPacket,
        sharePasswordSalt: shareUrl.SharePasswordSalt,
        hasCustomPassword: hasCustomPassword({ flags: shareUrl.Flags }),
        hasGeneratedPasswordIncluded: hasGeneratedPasswordIncluded({ flags: shareUrl.Flags }),
        numAccesses: shareUrl.NumAccesses,
        urlPasswordSalt: shareUrl.UrlPasswordSalt,
        srpVerifier: shareUrl.SRPVerifier,
        srpModulusID: shareUrl.SRPModulusID,
        maxAccesses: shareUrl.MaxAccesses,
        permissions: shareUrl.Permissions,
    };
};

export const photoPayloadToPhotos = (photo: PhotoPayload): Photo => {
    return {
        linkId: photo.LinkID,
        captureTime: photo.CaptureTime,
        hash: photo.Hash ?? undefined,
        contentHash: photo.ContentHash ?? undefined,
        tags: photo.Tags,
        relatedPhotos: photo.RelatedPhotos?.map((relatedPhoto) => ({
            linkId: relatedPhoto.LinkID,
            captureTime: relatedPhoto.CaptureTime,
            hash: relatedPhoto.Hash ?? undefined,
            contentHash: relatedPhoto.ContentHash ?? undefined,
        })),
    };
};

export const decryptedLinkToPhotos = (link: DecryptedLink, relatedPhotoLinks: DecryptedLink[]): Photo => {
    return {
        linkId: link.linkId,
        captureTime: link?.activeRevision?.photo?.captureTime ?? link.createTime,
        hash: link?.activeRevision?.photo?.hash ?? undefined,
        contentHash: link?.activeRevision?.photo?.contentHash,
        tags: link.photoProperties?.tags ?? [],
        relatedPhotos: relatedPhotoLinks.map((relatedPhotoLink) => ({
            linkId: relatedPhotoLink.linkId,
            captureTime: relatedPhotoLink?.activeRevision?.photo?.captureTime ?? relatedPhotoLink.createTime,
            hash: relatedPhotoLink?.activeRevision?.photo?.hash ?? undefined,
            contentHash: relatedPhotoLink?.activeRevision?.photo?.contentHash,
        })),
    };
};

export const revisionPayloadToRevision = (revision: DriveFileRevisionPayload): DriveFileRevision => {
    return {
        id: revision.ID,
        createTime: revision.CreateTime,
        size: revision.Size,
        state: revision.State,
        manifestSignature: revision.ManifestSignature,
        signatureEmail: revision.SignatureEmail,
        blocs: revision.Blocks,
        thumbnails: revision.Thumbnails.map((Thumbnail) => ({
            id: Thumbnail.ThumbnailID,
            type: Thumbnail.Type,
            hash: Thumbnail.Hash,
            size: Thumbnail.Size,
        })),
        xAttr: revision.XAttr,
    };
};

export const shareInvitationPayloadToShareInvitation = (shareInvitation: ShareInvitationPayload): ShareInvitation => {
    return {
        invitationId: shareInvitation.InvitationID,
        inviterEmail: shareInvitation.InviterEmail,
        inviteeEmail: shareInvitation.InviteeEmail,
        permissions: shareInvitation.Permissions,
        keyPacket: shareInvitation.KeyPacket,
        keyPacketSignature: shareInvitation.KeyPacketSignature,
        createTime: shareInvitation.CreateTime,
        state: shareInvitation.State,
    };
};

export const shareExternalInvitationPayloadToShareExternalInvitation = (
    shareExternalInvitation: ShareExternalInvitationPayload
): ShareExternalInvitation => {
    return {
        externalInvitationId: shareExternalInvitation.ExternalInvitationID,
        inviterEmail: shareExternalInvitation.InviterEmail,
        inviteeEmail: shareExternalInvitation.InviteeEmail,
        permissions: shareExternalInvitation.Permissions,
        createTime: shareExternalInvitation.CreateTime,
        state: shareExternalInvitation.State,
        externalInvitationSignature: shareExternalInvitation.ExternalInvitationSignature,
    };
};

export const shareInvitationDetailsPayloadToShareInvitationDetails = (
    shareInvitationDetails: ShareInvitationDetailsPayload
): ShareInvitationDetails => {
    return {
        invitation: shareInvitationPayloadToShareInvitation(shareInvitationDetails.Invitation),
        share: {
            shareId: shareInvitationDetails.Share.ShareID,
            volumeId: shareInvitationDetails.Share.VolumeID,
            passphrase: shareInvitationDetails.Share.Passphrase,
            shareKey: shareInvitationDetails.Share.ShareKey,
            creatorEmail: shareInvitationDetails.Share.CreatorEmail,
        },
        link: {
            linkId: shareInvitationDetails.Link.LinkID,
            name: shareInvitationDetails.Link.Name,
            mimeType:
                shareInvitationDetails.Link.MIMEType ||
                (shareInvitationDetails.Link.Type === LinkType.ALBUM ? 'Album' : ''),
            isFile: shareInvitationDetails.Link.Type === LinkType.FILE,
            type: shareInvitationDetails.Link.Type,
        },
    };
};

export const sharedUrlInfoPayloadToSharedUrlInfo = (sharedUrlInfoPayload: SharedURLInfoPayload): SharedUrlInfo => {
    return {
        contentKeyPacket: sharedUrlInfoPayload.ContentKeyPacket,
        linkId: sharedUrlInfoPayload.LinkID,
        linkType: sharedUrlInfoPayload.LinkType,
        mimeType: sharedUrlInfoPayload.MIMEType,
        name: sharedUrlInfoPayload.Name,
        nodeKey: sharedUrlInfoPayload.NodeKey,
        nodeHashKey: sharedUrlInfoPayload.NodeHashKey,
        nodePassphrase: sharedUrlInfoPayload.NodePassphrase,
        nodePassphraseSignature: sharedUrlInfoPayload.NodePassphraseSignature,
        permissions: sharedUrlInfoPayload.Permissions,
        shareKey: sharedUrlInfoPayload.ShareKey,
        sharePassphrase: sharedUrlInfoPayload.SharePassphrase,
        sharePasswordSalt: sharedUrlInfoPayload.SharePasswordSalt,
        size: sharedUrlInfoPayload.Size,
        signatureEmail: sharedUrlInfoPayload.SignatureEmail,
        thumbnailUrlInfo: sharedUrlInfoPayload.ThumbnailURLInfo,
        token: sharedUrlInfoPayload.Token,
    };
};

export function volumePayloadToVolume(volume: DriveVolumePayload): DriveVolume {
    return {
        id: volume.ID,
        volumeId: volume.VolumeID,
        createTime: volume.CreateTime || undefined,
        modifyTime: volume.ModifyTime || undefined,
        usedSpace: volume.UsedSpace,
        downloadedBytes: volume.DownloadedBytes,
        uploadedBytes: volume.UploadedBytes,
        state: volume.State,
        share: {
            shareId: volume.Share.ShareID,
            id: volume.Share.ID,
            linkId: volume.Share.LinkID,
        },
        type: volume.Type,
        restoreStatus: volume.RestoreStatus || undefined,
    };
}
