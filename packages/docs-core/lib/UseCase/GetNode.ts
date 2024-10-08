import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import type { NodeMeta, PublicNodeMeta, DecryptedNode } from '@proton/drive-store'
import { getErrorString } from '../Util/GetErrorString'
import { isPublicNodeMeta } from '@proton/drive-store/lib/interface'
import type { DocumentMetaInterface } from '@proton/docs-shared'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'

type GetNodeResult = {
  node: DecryptedNode
  refreshedDocMeta?: DocumentMetaInterface
}

export class GetNode implements UseCaseInterface<GetNodeResult> {
  constructor(private compatWrapper: DriveCompatWrapper) {}

  async execute(
    nodeMeta: NodeMeta | PublicNodeMeta,
    docMetaToRefresh?: DocumentMetaInterface,
  ): Promise<Result<GetNodeResult>> {
    try {
      const node = isPublicNodeMeta(nodeMeta)
        ? await this.compatWrapper.publicCompat?.getNode(nodeMeta)
        : await this.compatWrapper.userCompat?.getNode(nodeMeta)

      if (!node) {
        return Result.fail('Incorrect compat used; node not found')
      }

      if (docMetaToRefresh) {
        const newDocMeta = docMetaToRefresh.copyWithNewValues({ name: node.name })
        return Result.ok({ node, refreshedDocMeta: newDocMeta })
      }

      return Result.ok({ node })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to get node')
    }
  }
}
