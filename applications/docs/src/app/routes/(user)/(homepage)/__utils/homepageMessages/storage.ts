import { c, msgid } from 'ttag'

import type { HomepageMessages } from '~/homepage'

// Copied from `getSizeFormat` (packages/shared/lib/helpers/humanSize.ts) and the `Storage` of Proton's `Sidebar`
// (packages/components/components/sidebar/Sidebar.tsx): the same contexts and msgids keep their translations.
export function createStorageMessages(): Pick<HomepageMessages, 'storage'> {
  return {
    storage: {
      bytes: (count: number) => c('file size format').ngettext(msgid`byte`, `bytes`, count),
      KB: c('file size format').t`KB`,
      MB: c('file size format').t`MB`,
      GB: c('file size format').t`GB`,
      currentStorage: c('Storage').t`Your current storage:`,
      upgradeStorage: c('Storage').t`Upgrade storage`,
      copyVersion: (version: string) => c('Info').t`Copy “${version}” to clipboard`,
      versionCopied: c('Info').t`Version number successfully copied to clipboard`,
    },
  }
}
