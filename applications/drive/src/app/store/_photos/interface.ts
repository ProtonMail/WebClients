import type { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import type { Album, DecryptedAlbum } from '../../photos/PhotosStore/PhotosWithAlbumsProvider';
import type { DecryptedLink } from '../_links/interface';

export interface Photo {
    linkId: string;
    captureTime: number;
    mainPhotoLinkId?: string;
    exif?: string;
    hash?: string;
    contentHash?: string;
    relatedPhotosLinkIds?: string[];
}

export interface AlbumPhoto extends Photo {
    parentLinkId: string; // the album link id
    rootShareId: string; // the album share id
}

// These are not coming from the BE but can't be equal to the PhotoTag
export enum AlbumTag {
    All = 10,
    MyAlbums = 11,
    Shared = 12,
    SharedWithMe = 13,
}

export type Tag = PhotoTag | AlbumTag;

export type PhotoLink =
    | DecryptedLink
    | {
          // These properties are always present, even on incomplete links
          linkId: string;
          rootShareId: string;
          parentLinkId: string;
          isFile: boolean;
          activeRevision: {
              photo: Photo;
          };
          photoProperties?: DecryptedLink['photoProperties'];
      };

export type AlbumLink =
    | DecryptedAlbum
    | {
          // These properties are always present, even on incomplete links
          linkId: string;
          rootShareId: string;
          parentLinkId: string;
          isFile: boolean;
          activeRevision: {
              album: Album;
          };
      };

export type PhotoGroup = string;
export type PhotoGridItem = PhotoLink | PhotoGroup;
