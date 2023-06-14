import { SenderImageMode, getLogo } from '@proton/shared/lib/api/images';
import { createUrl } from '@proton/shared/lib/fetch/helpers';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';

export const getImageSize = () => {
    if (window.devicePixelRatio >= 4) {
        return 128;
    }

    if (window.devicePixelRatio > 1) {
        return 64;
    }

    /*
    If the user has changed the default font size
    (via browser settings or accessibility settings)
    then increase the image definition
    */
    const fontSize = rootFontSize();
    if (fontSize > 16) {
        return 64;
    }

    return 32;
};

export const getSenderImageUrl = (
    apiUrl: string,
    UID: string,
    emailAddress: string,
    size?: number,
    bimiSelector?: string,
    mode?: SenderImageMode
) => {
    const config = getLogo(emailAddress, size, bimiSelector, mode, UID);
    const prefixedUrl = `${apiUrl}/${config.url}`;
    const url = createUrl(prefixedUrl, config.params);
    return url.toString();
};
