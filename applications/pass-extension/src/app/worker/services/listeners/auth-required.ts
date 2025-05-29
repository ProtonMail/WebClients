import { intoUserIdentifier } from '@proton/pass/lib/items/item.utils';
import type { ItemRevision } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

const attemptedBasicAuthRequests = new Map<string, number>();

type AuthRequiredParams = {
    items: ItemRevision<'login'>[];
    url: string;
    requestId: string;
};

export const onAuthRequired = ({ items, url, requestId }: AuthRequiredParams) => {
    // If url already has the credentials embedded, do nothing
    if (/:\/\/(.)+:(.)+@/.test(url)) return { cancel: false };

    // If there are no items, do nothing
    if (!items.length) return { cancel: false };

    // Mechanism to prevent infinite loop when credentials are incorrect
    const requestAttempt = attemptedBasicAuthRequests.get(requestId) ?? 0;
    if (requestAttempt >= items.length) return { cancel: false };

    attemptedBasicAuthRequests.set(requestId, requestAttempt + 1);

    // Clear the Map after 2 seconds
    setTimeout(() => attemptedBasicAuthRequests.delete(requestId), 2000);

    // If there are more than 1 login credentials, try with each one
    const item = items[requestAttempt];

    return {
        authCredentials: {
            username: intoUserIdentifier(item),
            password: deobfuscate(item.data.content.password),
        },
    };
};
