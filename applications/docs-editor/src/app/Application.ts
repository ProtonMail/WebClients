import { DocumentRole, DocumentRoleType, InternalEventBus } from '@proton/docs-shared'
import { Logger, LoggerInterface } from '@proton/utils/logs'

export class Application {
  public readonly eventBus = new InternalEventBus()
  private role: DocumentRole = new DocumentRole('Viewer')
  public readonly logger: LoggerInterface

  constructor() {
    this.logger = new Logger('docs-editor')
  }

  public setRole(roleType: DocumentRoleType) {
    this.role = new DocumentRole(roleType)
  }

  public getRole() {
    return this.role
  }
}
