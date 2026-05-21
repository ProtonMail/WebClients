import type { DecryptedLink, SharedUrlInfo } from '../../../legacy/store';

export interface PublicShare {
    sharedUrlInfo: SharedUrlInfo;
    link: DecryptedLink;
}
export interface PublicShareStore {
    publicShare: PublicShare | undefined;
    viewOnly: boolean;
    // Public share Actions
    setPublicShare: (publicShare: PublicShare) => void;
}
