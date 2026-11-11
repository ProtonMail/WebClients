// The values the homepage uses from APPS and DRIVE_APP_NAME in packages/shared/lib/constants.ts
export const APPS = {
  PROTONDOCS: 'proton-docs',
  PROTONDRIVE: 'proton-drive',
} as const

export const DRIVE_APP_NAME = 'Proton Drive'

type HomepageApp = (typeof APPS)[keyof typeof APPS]

/** The host's `getAppHref` for the signed-in user, its local ID bound, injected. */
export type GetAppHref = (path: string, app: HomepageApp) => string
