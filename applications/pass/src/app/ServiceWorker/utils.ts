import { type MaybeNull } from '@proton/pass/types';

export const getUID = (event: FetchEvent): MaybeNull<string> => {
    const requestHeaders = event.request.headers;
    return requestHeaders.get('X-Pm-Uid');
};
