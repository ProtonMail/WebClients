import { API_CODES } from '../../constants';
import { Api } from '../../interfaces';
import { GetCanonicalAddressesResponse } from '../../interfaces/calendar';
import { SimpleMap } from '../../interfaces/utils';
import { getCanonicalAddresses } from '../addresses';

export const getCanonicalEmailMap = async (emails: string[] = [], api: Api) => {
    const map: SimpleMap<string> = {};
    if (emails.length) {
        const encodedEmails = emails.map((email) => encodeURIComponent(email));
        const { Responses, Code } = await api<GetCanonicalAddressesResponse>(getCanonicalAddresses(encodedEmails));
        if (Code !== API_CODES.GLOBAL_SUCCESS) {
            throw new Error('Canonize operation failed');
        }
        Responses.forEach(({ Email, Response: { Code, CanonicalEmail } }) => {
            if (Code !== API_CODES.SINGLE_SUCCESS) {
                throw new Error('Canonize operation failed');
            }
            map[Email] = CanonicalEmail;
        });
    }
    return map;
};
