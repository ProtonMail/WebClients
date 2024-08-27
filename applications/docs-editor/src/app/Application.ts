import type { DocumentRoleType } from '@proton/docs-shared'
import { DocumentRole, InternalEventBus } from '@proton/docs-shared'
import type { LoggerInterface } from '@proton/utils/logs'
import { Logger } from '@proton/utils/logs'

export class Application {
  public readonly eventBus = new InternalEventBus()
  private role: DocumentRole = new DocumentRole('Viewer')
  public readonly logger: LoggerInterface
  public languageCode: Intl.LocalesArgument = 'en'

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
}
