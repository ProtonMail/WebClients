export type DocumentRoleType = 'Viewer' | 'Commenter' | 'Editor' | 'Admin'

export class DocumentRole {
  constructor(public readonly roleType: DocumentRoleType) {}

  public canEdit(): boolean {
    return this.roleType === 'Editor' || this.roleType === 'Admin'
  }

  isAdmin(): boolean {
    return this.roleType === 'Admin'
  }

  isViewer(): boolean {
    return this.roleType === 'Viewer'
  }

  canComment(): boolean {
    return this.roleType === 'Commenter' || this.roleType === 'Editor' || this.roleType === 'Admin'
  }
}
