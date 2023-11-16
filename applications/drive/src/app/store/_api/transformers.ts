import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import { isMainShare } from '@proton/shared/lib/drive/utils/share';
import type { DevicePayload } from '@proton/shared/lib/interfaces/drive/device';
import type { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';
import { DriveFileRevisionPayload } from '@proton/shared/lib/interfaces/drive/file';
import { LinkMeta, LinkType, SharedUrlInfo } from '@proton/shared/lib/interfaces/drive/link';
import type { Photo as PhotoPayload } from '@proton/shared/lib/interfaces/drive/photos';
import type { ShareMeta, ShareMetaShort } from '@proton/shared/lib/interfaces/drive/share';
import type { ShareURL as ShareURLPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import type { Device } from '../_devices';
import type { DriveEvents } from '../_events';
import type { EncryptedLink } from '../_links';
import type { Photo } from '../_photos';
import type { DriveFileRevision } from '../_revisions';
import { hasCustomPassword, hasGeneratedPasswordIncluded } from '../_shares';
import type { Share, ShareURL, ShareWithKey } from '../_shares';

// LinkMetaWithShareURL is used when loading shared links.
// We need this to load information about number of accesses.
type LinkMetaWithShareURL = LinkMeta & {
    ShareUrls: (SharedUrlInfo & {
        ShareURL?: ShareURLPayload;
    })[];
};

export function linkMetaToEncryptedLink(link: LinkMetaWithShareURL, shareId: string): EncryptedLink {
    return {
        linkId: link.LinkID,
        parentLinkId: link.ParentLinkID,
        // API recognises only file and folder at this moment. In the future,
        // it might include hard- and soft-links, but still, for our case we
        // will differenciate only between files and folders, so we can convert
        // to simple boolean property.
        isFile: link.Type === LinkType.FILE,
        name: link.Name,
        nameSignatureAddress: link.NameSignatureEmail,
        mimeType: link.MIMEType,
        size: link.Size,
        hash: link.Hash,
        activeRevision: link.FileProperties?.ActiveRevision
            ? {
                  id: link.FileProperties.ActiveRevision.ID,
                  size: link.FileProperties.ActiveRevision.Size,
                  signatureAddress: link.FileProperties.ActiveRevision.SignatureAddress,
                  thumbnail: link.FileProperties.ActiveRevision.ThumbnailURLInfo
                      ? {
                            bareUrl: link.FileProperties.ActiveRevision.ThumbnailURLInfo.BareURL,
                            token: link.FileProperties.ActiveRevision.ThumbnailURLInfo.Token,
                        }
                      : undefined,
                  photo: link.FileProperties.ActiveRevision.Photo
                      ? {
                            linkId: link.FileProperties.ActiveRevision.Photo.LinkID,
                            captureTime: link.FileProperties.ActiveRevision.Photo.CaptureTime,
                            contentHash: link.FileProperties.ActiveRevision.Photo.ContentHash ?? undefined,
                            mainPhotoLinkId: link.FileProperties.ActiveRevision.Photo.MainPhotoLinkID ?? undefined,
                            hash: link.FileProperties.ActiveRevision.Photo.Hash ?? undefined,
                        }
                      : undefined,
              }
            : undefined,
        createTime: link.CreateTime,
        metaDataModifyTime: link.ModifyTime,
        trashed: link.Trashed,
        hasThumbnail: link.FileProperties?.ActiveRevision?.Thumbnail === 1,
        isShared: !!link.Shared,
        shareId: link.ShareIDs?.length > 0 ? link.ShareIDs[0] : undefined,
        rootShareId: shareId,
        shareUrl:
            link.ShareUrls?.length > 0
                ? {
                      id: link.ShareUrls[0].ShareUrlID,
                      token: link.ShareUrls[0].Token,
                      isExpired: link.UrlsExpired,
                      createTime: link.ShareUrls[0].CreateTime,
                      expireTime: link.ShareUrls[0].ExpireTime,
                      numAccesses: link.ShareUrls[0].NumAccesses,
                  }
                : undefined,
        nodeKey: link.NodeKey,
        nodePassphrase: link.NodePassphrase,
        nodePassphraseSignature: link.NodePassphraseSignature,
        nodeHashKey: link.FolderProperties?.NodeHashKey,
        contentKeyPacket: link.FileProperties?.ContentKeyPacket,
        contentKeyPacketSignature: link.FileProperties?.ContentKeyPacketSignature,
        signatureAddress: link.SignatureAddress,
        xAttr: link.XAttr,
    };
}

export function shareMetaShortToShare(share: ShareMetaShort): Share {
    return {
        shareId: share.ShareID,
        rootLinkId: share.LinkID,
        volumeId: share.VolumeID,
        creator: share.Creator,
        isLocked: share.Locked,
        isDefault: isMainShare(share),
        isVolumeSoftDeleted: share.VolumeSoftDeleted,
        possibleKeyPackets: (share.PossibleKeyPackets || []).map(({ KeyPacket }) => KeyPacket),
        type: share.Type,
        state: share.State,
    };
}

export function shareMetaToShareWithKey(share: ShareMeta): ShareWithKey {
    return {
        ...shareMetaShortToShare(share),
        key: share.Key,
        passphrase: share.Passphrase,
        passphraseSignature: share.PassphraseSignature,
        addressId: share.AddressID,
        rootLinkRecoveryPassphrase: share.RootLinkRecoveryPassphrase,
    };
}

export function driveEventsResultToDriveEvents({ EventID, Events, Refresh }: DriveEventsResult): DriveEvents {
    return {
        eventId: EventID,
        events: Events.map((event) => ({
            eventType: event.EventType,
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
        mainPhotoLinkId: photo.MainPhotoLinkID ?? undefined,
        hash: photo.Hash ?? undefined,
        contentHash: photo.ContentHash ?? undefined,
    };
};

export const revisionPayloadToRevision = (revision: DriveFileRevisionPayload): DriveFileRevision => {
    return {
        id: revision.ID,
        createTime: revision.CreateTime,
        size: revision.Size,
        state: revision.State,
        manifestSignature: revision.ManifestSignature,
        signatureAddress: revision.SignatureAddress,
        signatureEmail: revision.SignatureEmail,
        blocs: revision.Blocks,
        thumbnails: revision.Thumbnails,
        xAttr: revision.XAttr,
    };
};
