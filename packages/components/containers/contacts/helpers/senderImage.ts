import type { SenderImageMode } from '@proton/shared/lib/api/images';
import { getLogo } from '@proton/shared/lib/api/images';
import { createUrl } from '@proton/shared/lib/fetch/helpers';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';

export const getImageSize = (size: number = 32) => {
    let ratio = 1;

    if (window.devicePixelRatio > 1) {
        ratio = 2;
    }

    if (window.devicePixelRatio >= 4) {
        ratio = 4;
    }

    /*
    If the user has changed the default font size
    (via browser settings or accessibility settings)
    then increase the image definition
    */
    const fontSize = rootFontSize();
    if (fontSize > 16) {
        ratio = 2;
    }

    return size * ratio;
};

export const getSenderImageUrl = ({
    apiUrl,
    UID,
    emailAddress,
    size,
    bimiSelector,
    mode,
}: {
    apiUrl: string;
    UID: string;
    emailAddress: string;
    size?: number;
    bimiSelector?: string;
    mode?: SenderImageMode;
}) => {
    const cleanedEmailAddress = emailAddress.toLowerCase();
    const config = getLogo({ Address: cleanedEmailAddress, Size: size, BimiSelector: bimiSelector, Mode: mode, UID });
    const prefixedUrl = `${apiUrl}/${config.url}`;
    const url = createUrl(prefixedUrl, config.params, window.location.origin);
    return url.toString();
};
