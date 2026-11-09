import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper'

// Copied from `~/components/document/DocumentLayout/DocumentHeader/DocumentHeader.tsx`, which imports docs-core.
/** Where switching accounts in the user menu comes back to. */
export function getWindowLocationExcludingDomain() {
  return stripLocalBasenameFromPathname(window.location.pathname) + window.location.search + window.location.hash
}
