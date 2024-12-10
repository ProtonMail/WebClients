import type { DocumentMetaInterface } from '@proton/docs-shared'
import { GenerateUUID } from '@proton/docs-shared'

export class DocumentMeta implements DocumentMetaInterface {
  public readonly uniqueIdentifier = GenerateUUID()

  constructor(
    public volumeId: string,
    public commitIds: string[],
    public createTime: number,
    public modifyTime: number,
    public name: string,
  ) {}

  copyWithNewValues(newValues: Partial<DocumentMetaInterface>): DocumentMetaInterface {
    return new DocumentMeta(
      newValues.volumeId ?? this.volumeId,
      newValues.commitIds ?? this.commitIds,
      newValues.createTime ?? this.createTime,
      newValues.modifyTime ?? this.modifyTime,
      newValues.name ?? this.name,
    )
  }

  latestCommitId(): string | undefined {
    return this.commitIds[this.commitIds.length - 1]
  }
}
