import { getLogo } from '@proton/shared/lib/api/images';
import { Api } from '@proton/shared/lib/interfaces';

const CACHE = {} as { [domain: string]: Promise<string> };

const fetchSenderLogo = async (api: Api, emailAddress: string, size?: number) => {
    try {
        const response: Response = await api({
            ...getLogo(emailAddress, size),
            output: 'raw',
            silence: true,
        });

        return URL.createObjectURL(await response.blob());
    } catch (error) {
        return '';
    }
};

export const getSenderLogo = (api: Api, emailAddress: string, size?: number): Promise<string> => {
    if (typeof CACHE[emailAddress] === 'undefined') {
        CACHE[emailAddress] = fetchSenderLogo(api, emailAddress, size);
    }

    return CACHE[emailAddress];
};
