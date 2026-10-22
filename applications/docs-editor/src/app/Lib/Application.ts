import { versionCookieAtLoad } from '@proton/components/helpers/versionCookie'
import type { DocumentRoleType } from '@proton/docs-shared/Doc/DocumentRole'
import { DocumentRole } from '@proton/docs-shared/Doc/DocumentRole'
import { InternalEventBus } from '@proton/docs-shared/Events/InternalEventBus'
import { SyncedEditorState } from '@proton/docs-shared/State/SyncedEditorState'
import { dateLocale as hostDateLocale } from '@proton/shared/lib/i18n'
import type { Environment } from '@proton/shared/lib/interfaces/Environment'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import { Logger } from '@proton/shared/lib/logs'

/** The account's date-fns locale, which `loadLocales` builds from its locale and time format settings. */
type DateLocale = typeof hostDateLocale

export class Application {
  public readonly eventBus = new InternalEventBus()
  /** Synced editor state. Synced from parent from to keep properties in sync. */
  public readonly syncedState = new SyncedEditorState()
  private role: DocumentRole = new DocumentRole('Viewer')
  public readonly logger: LoggerInterface
  public languageCode: Intl.LocalesArgument = 'en'
  private readonly localeSubscribers = new Set<(languageCode: Intl.LocalesArgument) => void>()
  public dateLocale: DateLocale = hostDateLocale
  private readonly dateLocaleSubscribers = new Set<(dateLocale: DateLocale) => void>()
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
    this.localeSubscribers.forEach((callback) => callback(languageCode))
  }

  public subscribeToLocale(callback: (languageCode: Intl.LocalesArgument) => void): () => void {
    this.localeSubscribers.add(callback)
    callback(this.languageCode)
    return () => {
      this.localeSubscribers.delete(callback)
    }
  }

  public setDateLocale(dateLocale: DateLocale): void {
    this.dateLocale = dateLocale
    this.dateLocaleSubscribers.forEach((callback) => callback(dateLocale))
  }

  public subscribeToDateLocale(callback: (dateLocale: DateLocale) => void): () => void {
    this.dateLocaleSubscribers.add(callback)
    callback(this.dateLocale)
    return () => {
      this.dateLocaleSubscribers.delete(callback)
    }
  }

  public setAppVersion(version: string): void {
    this.appVersion = version
  }
}
