import { DeepPartial } from '@proton/shared/lib/interfaces';

import type { DecryptedLink } from '../_links/interface';

export interface Photo {
    linkId: string;
    captureTime: number;
    mainPhotoLinkId?: string;
    exif?: string;
    hash?: string;
    contentHash?: string;
}

export type PhotoLink = DeepPartial<DecryptedLink> & {
    linkId: string;
    // If the link is in photos share it should always have activeRevision
    activeRevision: DeepPartial<DecryptedLink['activeRevision']> & {
        photo: Photo;
    };
};
export type PhotoGroup = string;
export type PhotoGridItem = PhotoLink | PhotoGroup;
