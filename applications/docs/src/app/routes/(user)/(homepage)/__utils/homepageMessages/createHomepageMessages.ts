import type { HomepageMessages } from '~/homepage'

import { createContentMessages } from './content'
import { createContextMenuMessages } from './contextMenu'
import { createDeletePermanentlyDialogMessages } from './deletePermanentlyDialog'
import { createDocumentActionsMessages } from './documentActions'
import { createDocumentsTableMessages } from './documentsTable'
import { createHeaderMessages } from './header'
import { createInvitesTableMessages } from './invitesTable'
import { createLoadingMessages } from './loading'
import { createNamesMessages } from './names'
import { createNewDocumentMessages } from './newDocument'
import { createPageTitleMessages } from './pageTitle'
import { createSidebarMessages } from './sidebar'
import { createSortMessages } from './sort'
import { createTrashMessages } from './trash'

/** Recreate after the host activates a locale. All groups are mandatory. */
export function createHomepageMessages(): HomepageMessages {
  return {
    ...createHeaderMessages(),
    ...createPageTitleMessages(),
    ...createSidebarMessages(),
    ...createNewDocumentMessages(),
    ...createContentMessages(),
    ...createDocumentsTableMessages(),
    ...createInvitesTableMessages(),
    ...createSortMessages(),
    ...createContextMenuMessages(),
    ...createDeletePermanentlyDialogMessages(),
    ...createDocumentActionsMessages(),
    ...createTrashMessages(),
    ...createLoadingMessages(),
    ...createNamesMessages(),
  }
}
