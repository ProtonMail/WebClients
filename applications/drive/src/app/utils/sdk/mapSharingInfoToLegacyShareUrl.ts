import { type ShareResult, splitPublicLinkUid } from '@proton/drive';

import { dateToLegacyTimestamp } from './legacyTime';

export const mapShareResultToLegacyShareUrl = (shareResult: ShareResult) => {
    if (!shareResult.publicLink) {
        return undefined;
    }
    const expirationTime = shareResult.publicLink.expirationTime
        ? dateToLegacyTimestamp(shareResult.publicLink.expirationTime)
        : null;
    return {
        id: splitPublicLinkUid(shareResult.publicLink.uid).publicLinkId,
        createTime: dateToLegacyTimestamp(shareResult.publicLink.creationTime),
        token: '',
        isExpired: expirationTime !== null ? expirationTime <= Math.floor(Date.now() / 1000) : false,
        expireTime: expirationTime,
    };
};
