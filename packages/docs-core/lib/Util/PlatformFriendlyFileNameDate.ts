import { format } from 'date-fns'

/**
 * Return a date string as a unique appendage for a file name that doesn't cause issues for native clients.
 * (Avoiding characters such as /)
 */
export function getPlatformFriendlyDateForFileName(): string {
  return format(new Date(), 'yyyy-MM-dd HH.mm.ss')
}
