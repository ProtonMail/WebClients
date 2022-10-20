import { SenderImageMode, getLogo } from '@proton/shared/lib/api/images';
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
