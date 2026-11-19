import { contentMessages } from './content'
import { contextMenuMessages } from './contextMenu'
import { deletePermanentlyDialogMessages } from './deletePermanentlyDialog'
import { documentActionsMessages } from './documentActions'
import { documentsTableMessages } from './documentsTable'
import { headerMessages } from './header'
import { invitesTableMessages } from './invitesTable'
import { loadingMessages } from './loading'
import { namesMessages } from './names'
import { newDocumentMessages } from './newDocument'
import { pageTitleMessages } from './pageTitle'
import { sidebarMessages } from './sidebar'
import { sortMessages } from './sort'
import { trashMessages } from './trash'

export const defaultHomepageMessages = {
  ...headerMessages,
  ...pageTitleMessages,
  ...sidebarMessages,
  ...newDocumentMessages,
  ...contentMessages,
  ...documentsTableMessages,
  ...invitesTableMessages,
  ...sortMessages,
  ...contextMenuMessages,
  ...deletePermanentlyDialogMessages,
  ...documentActionsMessages,
  ...trashMessages,
  ...loadingMessages,
  ...namesMessages,
}

export type HomepageMessages = typeof defaultHomepageMessages
