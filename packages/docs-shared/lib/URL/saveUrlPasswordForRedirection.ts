import localStorageWithExpiry from '@proton/shared/lib/api/helpers/localStorageWithExpiry'

import { PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY } from './getUrlPassword'

/**
 * Save the password locally before a signup/signin redirection,
 * so it can be restored with getUrlPassword upon returning to the public share.
 */
export const saveUrlPasswordForRedirection = (urlPassword: string) => {
  localStorageWithExpiry.storeData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY, urlPassword)
}
