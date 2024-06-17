import { DocumentRole, DocumentRoleType, InternalEventBus } from '@proton/docs-shared'

export class Application {
  public readonly eventBus = new InternalEventBus()
  private role: DocumentRole = new DocumentRole('Viewer')

  public setRole(roleType: DocumentRoleType) {
    this.role = new DocumentRole(roleType)
  }

  public getRole() {
    return this.role
  }
}
