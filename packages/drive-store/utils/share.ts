import type { DecryptedLink } from '../store';

export const getSharedStatus = (link?: DecryptedLink) => {
    if (!link?.isShared) {
        return '';
    }
    if (link?.shareUrl?.isExpired || link?.trashed) {
        return 'inactive';
    }
    return 'shared';
};
