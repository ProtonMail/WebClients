import { DocumentMetaInterface } from '@proton/docs-shared'

export class DocumentMeta {
  constructor(
    public volumeId: string,
    public linkId: string,
    public commitIds: string[],
    public createTime: number,
    public modifyTime: number,
    public name: string,
  ) {}

  public isEqual(other: DocumentMeta): boolean {
    return this.volumeId === other.volumeId && this.linkId === other.linkId
  }

  copyWithNewValues(newValues: Partial<DocumentMetaInterface>): DocumentMetaInterface {
    return new DocumentMeta(
      newValues.volumeId ?? this.volumeId,
      newValues.linkId ?? this.linkId,
      newValues.commitIds ?? this.commitIds,
      newValues.createTime ?? this.createTime,
      newValues.modifyTime ?? this.modifyTime,
      newValues.name ?? this.name,
    )
  }

  public get uniqueIdentifier(): string {
    return this.linkId
  }
}
