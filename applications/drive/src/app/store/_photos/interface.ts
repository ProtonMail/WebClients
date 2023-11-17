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
    // These properties are always present, even on incomplete links
    linkId: string;
    rootShareId: string;
    parentLinkId: string;
    isFile: boolean;
    activeRevision: DeepPartial<DecryptedLink['activeRevision']> & {
        photo: Photo;
    };

    // This is required for trashing and notifications
    name: string;
};
export type PhotoGroup = string;
export type PhotoGridItem = PhotoLink | PhotoGroup;
