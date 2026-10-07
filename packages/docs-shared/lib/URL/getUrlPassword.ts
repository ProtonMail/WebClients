import localStorageWithExpiry from '@proton/shared/lib/api/helpers/localStorageWithExpiry'

// Must match the key used by Drive when saving the password before signup/signin redirection
const PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY = 'public-share-redirect-password'

/**
 * When coming back from signup/signin the hash is empty,
 * so restore the url password from local storage into the location hash.
 */
export function getUrlPassword() {
  const password = window.location.hash.replace('#', '')
  if (password) {
    return password
  }
  const storedPassword = localStorageWithExpiry.getData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY) || ''
  window.location.hash = storedPassword
  return storedPassword
}
