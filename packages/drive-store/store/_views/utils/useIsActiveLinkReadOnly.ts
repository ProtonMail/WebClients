import type { DecryptedLink } from '../../_links/interface';
import { ShareType } from '../../_shares/interface';

const isLinkRoot = (link: DecryptedLink) => {
    return !link.parentLinkId;
};

export const isLinkReadOnly = (link: DecryptedLink, shareType: ShareType) => {
    return shareType === ShareType.device && isLinkRoot(link);
};
