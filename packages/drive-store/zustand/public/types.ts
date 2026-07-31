import type { DecryptedLink, SharedUrlInfo } from '../../store';

interface PublicShare {
    sharedUrlInfo: SharedUrlInfo;
    link: DecryptedLink;
}
export interface PublicShareStore {
    publicShare: PublicShare | undefined;
    viewOnly: boolean;
    // Public share Actions
    setPublicShare: (publicShare: PublicShare) => void;
}
