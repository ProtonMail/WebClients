import type { DecryptedLink } from '../../store/_links/interface';
import type { SharedUrlInfo } from '../../store/_shares/interface';

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
