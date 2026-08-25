export type DocumentRoleType =
  | 'Viewer'
  | 'Commenter'
  | 'Editor'
  | 'Admin'
  | 'PublicViewer'
  | 'PublicEditor'
  // Not used in canEdit/canRename/canComment because this kind of user is redirected to private app
  // This means user has direct share access to the file besides the public link
  | 'PublicViewerWithAccess'
  | 'PublicEditorWithAccess'

export class DocumentRole {
  constructor(public readonly roleType: DocumentRoleType) {}

  public canEdit(): boolean {
    return this.roleType === 'Editor' || this.roleType === 'Admin' || this.roleType === 'PublicEditor'
  }

  isAdmin(): boolean {
    return this.roleType === 'Admin'
  }

  isAdminOrOwner(): boolean {
    return this.isAdmin()
  }

  canRename(): boolean {
    return this.roleType === 'Editor' || this.roleType === 'Admin' || this.roleType === 'PublicEditor'
  }

  canTrash(): boolean {
    return this.isAdmin()
  }

  canShare(): boolean {
    return this.isAdmin()
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
    return this.roleType === 'PublicEditor' || this.roleType === 'PublicEditorWithAccess'
  }

  isPublicUserWithAccess(): boolean {
    return this.roleType === 'PublicViewerWithAccess' || this.roleType === 'PublicEditorWithAccess'
  }

  isPublicViewerOrEditor(): boolean {
    return this.isPublicViewer() || this.isPublicEditor()
  }

  canReadPublicShareUrl(): boolean {
    return this.isAdmin()
  }
}
