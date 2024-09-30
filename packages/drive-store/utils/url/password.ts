import localStorageWithExpiry from '@proton/shared/lib/api/helpers/localStorageWithExpiry';
import { SharedURLFlags } from '@proton/shared/lib/interfaces/drive/sharing';

import { splitGeneratedAndCustomPassword } from '../../store/_shares';

export const PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY = 'public-share-redirect-password';

/*
 *
 * These functions should be used each time you want to retrieve, save or delete a public sharing URL password
 * This is used currently for redirection as we don't want to include password in backend redirection.
 * Password is saved locally and upon redirection post signup/signin used to read the publicly shared url file.
 * Password saved locally expire after 10 minutes and is manually deleted each time you browse a publicly shared url (after you read the value).
 *
 * When retrieving an URL password, it is recommended to use these functions and not re-create others.
 */

export const deleteStoredUrlPassword = () => {
    localStorageWithExpiry.deleteData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY);
};

export const saveUrlPasswordForRedirection = (urlPassword: string) => {
    localStorageWithExpiry.storeData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY, urlPassword);
};

export const getUrlPasswordWithCustomPassword = (urlPassword: string) => {
    // Since we can have custom password in urlPassword we retrieve the generated password from it to open link without it
    // We can force type 2 of flags as we hide bookmarking feature to legacy shared url pages
    const [password] = splitGeneratedAndCustomPassword(urlPassword, {
        flags: SharedURLFlags.GeneratedPasswordWithCustom,
    });
    return password;
};

export const getUrlPassword = ({
    readOnly = false,
    filterCustom = false,
}: { readOnly?: boolean; filterCustom?: boolean } = {}) => {
    const { hash } = window.location;
    let pass = hash.replace('#', '');
    // If user is redirected from signup/sign-in we retrieve the password from localStorage, if available
    if (!pass) {
        pass = localStorageWithExpiry.getData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY) || '';
        pass = filterCustom ? getUrlPasswordWithCustomPassword(pass) : pass;
        if (readOnly) {
            return pass;
        }
        window.location.hash = pass;
    }
    return pass;
};
