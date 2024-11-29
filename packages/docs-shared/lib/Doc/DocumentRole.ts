export type DocumentRoleType =
  | 'Viewer'
  | 'Commenter'
  | 'Editor'
  | 'Admin'
  | 'PublicViewer'
  | 'PublicViewerWithAccess'
  | 'PublicEditor'

export class DocumentRole {
  constructor(public readonly roleType: DocumentRoleType) {}

  public canEdit(): boolean {
    return this.roleType === 'Editor' || this.roleType === 'Admin' || this.roleType === 'PublicEditor'
  }

  isAdmin(): boolean {
    return this.roleType === 'Admin'
  }

  canComment(): boolean {
    return (
      this.roleType === 'Commenter' ||
      this.roleType === 'Editor' ||
      this.roleType === 'Admin' ||
      this.roleType === 'PublicEditor'
    )
  }

  isPublicViewer(): boolean {
    return this.roleType === 'PublicViewer' || this.roleType === 'PublicViewerWithAccess'
  }

  isPublicEditor(): boolean {
    return this.roleType === 'PublicEditor'
  }

  isPublicViewerWithAccess(): boolean {
    return this.roleType === 'PublicViewerWithAccess'
  }

  isPublicViewerOrEditor(): boolean {
    return this.isPublicViewer() || this.isPublicEditor()
  }
}
