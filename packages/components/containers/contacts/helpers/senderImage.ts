import { SenderImageMode, getLogo } from '@proton/shared/lib/api/images';
import { createUrl } from '@proton/shared/lib/fetch/helpers';
import { Api } from '@proton/shared/lib/interfaces';

const CACHE = {} as { [domain: string]: Promise<string> };

const fetchSenderLogo = async (
    api: Api,
    emailAddress: string,
    size?: number,
    bimiSelector?: string,
    mode?: SenderImageMode
) => {
    try {
        const response: Response = await api({
            ...getLogo(emailAddress, size, bimiSelector, mode),
            output: 'raw',
            silence: true,
        });

        return URL.createObjectURL(await response.blob());
    } catch (error) {
        return '';
    }
};

export const getSenderLogo = (
    api: Api,
    emailAddress: string,
    size?: number,
    bimiSelector?: string,
    mode?: SenderImageMode
): Promise<string> => {
    if (typeof CACHE[emailAddress] === 'undefined') {
        CACHE[emailAddress] = fetchSenderLogo(api, emailAddress, size, bimiSelector, mode);
    }

    return CACHE[emailAddress];
};

export const getImageSize = () => {
    if (window.devicePixelRatio >= 4) {
        return 128;
    }

    if (window.devicePixelRatio > 1) {
        return 64;
    }

    return 32;
};

export const getSenderImageUrl = (
    UID: string,
    emailAddress: string,
    size?: number,
    bimiSelector?: string,
    mode?: SenderImageMode
) => {
    const config = getLogo(emailAddress, size, bimiSelector, mode, UID);
    const prefixedUrl = `api/${config.url}`; // api/ is required to set the AUTH cookie
    const url = createUrl(prefixedUrl, config.params);
    return url.toString();
};
