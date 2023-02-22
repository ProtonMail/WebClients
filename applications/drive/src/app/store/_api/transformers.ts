import { isMainShare } from '@proton/shared/lib/drive/utils/share';
import { DevicePayload } from '@proton/shared/lib/interfaces/drive/device';
import { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';
import { LinkMeta, LinkType, SharedUrlInfo } from '@proton/shared/lib/interfaces/drive/link';
import { ShareMeta, ShareMetaShort } from '@proton/shared/lib/interfaces/drive/share';
import { ShareURL } from '@proton/shared/lib/interfaces/drive/sharing';

import { Device } from '../_devices';
import { DriveEvents } from '../_events/interface';
import { EncryptedLink } from '../_links/interface';
import { Share, ShareWithKey } from '../_shares/interface';

// LinkMetaWithShareURL is used when loading shared links.
// We need this to load information about number of accesses.
type LinkMetaWithShareURL = LinkMeta & {
    ShareUrls: (SharedUrlInfo & {
        ShareURL?: ShareURL;
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

export function driveEventsResultToDriveEvents(
    { EventID, Events, Refresh }: DriveEventsResult,
    shareId: string
): DriveEvents {
    return {
        eventId: EventID,
        events: Events.map((event) => ({
            eventType: event.EventType,
            encryptedLink: linkMetaToEncryptedLink(event.Link, shareId),
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
    };
};
