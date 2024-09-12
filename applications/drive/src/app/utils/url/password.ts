import localStorageWithExpiry from '@proton/shared/lib/api/helpers/localStorageWithExpiry';

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

export const getUrlPassword = ({ readOnly = false }: { readOnly?: boolean } = {}) => {
    const { hash } = window.location;
    let pass = hash.replace('#', '');
    // If user is redirected from signup/sign-in we retrieve the password from localStorage, if available
    if (!pass) {
        pass = localStorageWithExpiry.getData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY) || '';
        if (readOnly) {
            return pass;
        }
        window.location.hash = pass;
    }
    return pass;
};
