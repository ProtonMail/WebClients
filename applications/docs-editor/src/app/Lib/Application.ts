import { versionCookieAtLoad } from '@proton/components/helpers/versionCookie'
import type { DocumentRoleType } from '@proton/docs-shared'
import { DocumentRole, InternalEventBus, SyncedEditorState } from '@proton/docs-shared'
import type { Environment } from '@proton/shared/lib/interfaces'
import type { LoggerInterface } from '@proton/utils/logs'
import { Logger } from '@proton/utils/logs'

export class Application {
  public readonly eventBus = new InternalEventBus()
  /** Synced editor state. Synced from parent from to keep properties in sync. */
  public readonly syncedState = new SyncedEditorState()
  private role: DocumentRole = new DocumentRole('Viewer')
  public readonly logger: LoggerInterface
  public languageCode: Intl.LocalesArgument = 'en'
  public appVersion: string = ''

  /**
   * `useEarlyAccess` throws an error when used without a <ProtonStoreProvider />
   * somewhere up the tree and we only need to use its `currentEnvironment` to check
   * whether we're in an alpha or beta environment, so we just use that value here directly.
   */
  public environment: Environment | undefined = versionCookieAtLoad

  constructor() {
    this.logger = new Logger('docs-editor')
  }

  public setRole(roleType: DocumentRoleType): void {
    this.role = new DocumentRole(roleType)
  }

  public getRole(): DocumentRole {
    return this.role
  }

  public setLocale(locale: string): void {
    const languageCode = locale.split('_')[0]

    this.logger.info('Setting editor language code', languageCode)
    this.languageCode = languageCode
  }

  public setAppVersion(version: string): void {
    this.appVersion = version
  }
}
