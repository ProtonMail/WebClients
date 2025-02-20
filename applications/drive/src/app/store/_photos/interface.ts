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

export enum PhotoTag {
    All = -1,
    // All these are defined by the BE
    Favorites = 0,
    Screenshots = 1,
    Videos = 2,
    LivePhotos = 3,
    MotionPhotos = 4,
    Selfies = 5,
    Portraits = 6,
    Bursts = 7,
    Panoramas = 8,
    Raw = 9,
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
