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
