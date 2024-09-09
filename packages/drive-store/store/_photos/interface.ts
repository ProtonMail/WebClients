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
export type PhotoGroup = string;
export type PhotoGridItem = PhotoLink | PhotoGroup;
