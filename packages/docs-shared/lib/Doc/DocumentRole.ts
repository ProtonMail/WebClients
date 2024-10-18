export type DocumentRoleType = 'Viewer' | 'Commenter' | 'Editor' | 'Admin' | 'PublicViewer' | 'PublicViewerWithAccess'

export class DocumentRole {
  constructor(public readonly roleType: DocumentRoleType) {}

  public canEdit(): boolean {
    return this.roleType === 'Editor' || this.roleType === 'Admin'
  }

  isAdmin(): boolean {
    return this.roleType === 'Admin'
  }

  canComment(): boolean {
    return this.roleType === 'Commenter' || this.roleType === 'Editor' || this.roleType === 'Admin'
  }

  isPublicViewer(): boolean {
    return this.roleType === 'PublicViewer' || this.roleType === 'PublicViewerWithAccess'
  }

  isPublicViewerWithAccess(): boolean {
    return this.roleType === 'PublicViewerWithAccess'
  }
}
