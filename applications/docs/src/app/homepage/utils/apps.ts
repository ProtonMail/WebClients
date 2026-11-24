// The values the homepage uses from APPS and DRIVE_APP_NAME in packages/shared/lib/constants.ts
export const APPS = {
  PROTONDOCS: 'proton-docs',
  PROTONDRIVE: 'proton-drive',
} as const

export const DRIVE_APP_NAME = 'Proton Drive'

/** `getAppName(APPS.PROTONDOCS)` of `@proton/shared/lib/apps/helper`. */
export const DOCS_APP_NAME = 'Proton Docs'

type HomepageApp = (typeof APPS)[keyof typeof APPS]

/** The host's `getAppHref` for the signed-in user, its local ID bound, injected. */
export type GetAppHref = (path: string, app: HomepageApp) => string
