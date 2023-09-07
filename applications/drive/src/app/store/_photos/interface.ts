import { DeepPartial } from '@proton/shared/lib/interfaces';

import { DecryptedLink } from '../_links';

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
};
export type PhotoGridItem = PhotoLink | string;
