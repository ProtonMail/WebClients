export type DocumentRoleType =
  | 'Viewer'
  | 'Commenter'
  | 'Editor'
  | 'Admin'
  | 'Owner'
  | 'PublicViewer'
  | 'PublicViewerWithAccess'
  | 'PublicEditor'
  | 'PublicEditorWithAccess'

export class DocumentRole {
  constructor(public readonly roleType: DocumentRoleType) {}

  public canEdit(): boolean {
    return (
      this.roleType === 'Editor' ||
      this.roleType === 'Admin' ||
      this.roleType === 'PublicEditor' ||
      this.roleType === 'Owner'
    )
  }

  isAdmin(): boolean {
    return this.roleType === 'Admin'
  }

  isOwner(): boolean {
    return this.roleType === 'Owner'
  }

  isAdminOrOwner(): boolean {
    return this.isAdmin() || this.isOwner()
  }

  /**
   * Technically, editors should be able to always rename, but there is a limitation of the Drive/Docs architecture
   * such that the parent key is required to successfully rename, and the Docs client, unlike the Drive client, may
   * not have this access.
   *
   * Currently, there is no way to determine if the user is the creator of a doc. So for now we allow any editor to rename,
   * even though the request may fail for them. The ideal goal is for "owner" to be accurate, but it is not.
   */
  canRename(): boolean {
    return (
      this.roleType === 'Editor' ||
      this.roleType === 'Admin' ||
      this.roleType === 'Owner' ||
      this.roleType === 'PublicEditor'
    )
  }

  canTrash(): boolean {
    return this.isOwner() || this.isAdmin()
  }

  canShare(): boolean {
    return this.isOwner() || this.isAdmin()
  }

  canComment(): boolean {
    return (
      this.roleType === 'Commenter' ||
      this.roleType === 'Editor' ||
      this.roleType === 'Admin' ||
      this.roleType === 'PublicEditor' ||
      this.roleType === 'Owner'
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
