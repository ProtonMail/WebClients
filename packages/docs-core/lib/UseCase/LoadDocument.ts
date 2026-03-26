import { DocumentRole, DynamicResult, Result } from '@proton/docs-shared'
import { DocumentState, PublicDocumentState } from '../State/DocumentState'
import { getCanWrite } from '@proton/shared/lib/drive/permissions'
import { getErrorString } from '../Util/GetErrorString'
import { LoadLogger } from '../LoadLogger/LoadLogger'
import type { DecryptCommit } from './DecryptCommit'
import type { DecryptedCommit } from '../Models/DecryptedCommit'
import {
  rawPermissionToRole,
  type DocumentEntitlements,
  type PublicDocumentEntitlements,
} from '../Types/DocumentEntitlements'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import type { GetDocumentKeys } from './GetDocumentKeys'
import type { GetDocumentMeta } from './GetDocumentMeta'
import type { GetNode } from './GetNode'
import type { LoggerInterface } from '@proton/utils/logs'
import type { NodeMeta, PublicNodeMeta, PublicDriveCompat, DriveCompat } from '@proton/drive-store'
import type { FetchMetaAndRawCommit } from './FetchMetaAndRawCommit'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import { jwtDecode } from 'jwt-decode'
import { realtimeTokenPayloadSchema } from './FetchRealtimeToken'

type LoadDocumentResult<E extends DocumentState | PublicDocumentState> = {
  documentState: E
}

type ErrorResult = {
  code?: DocsApiErrorCode
  message: string
}

/**
 * Performs initial loading procedure for document, including fetching keys and latest commit binary from DX.
 */
export class LoadDocument {
  constructor(
    private compatWrapper: DriveCompatWrapper<DriveCompat | PublicDriveCompat>,
    private getDocumentMeta: GetDocumentMeta,
    private getNode: GetNode,
    private decryptCommit: DecryptCommit,
    private loadMetaAndCommit: FetchMetaAndRawCommit,
    private getDocumentKeys: GetDocumentKeys,
    private logger: LoggerInterface,
  ) {}

  async executePrivate(nodeMeta: NodeMeta): Promise<DynamicResult<LoadDocumentResult<DocumentState>, ErrorResult>> {
    LoadLogger.logEventRelativeToLoadTime('[LoadDocument] Beginning to load document')
    try {
      const [nodeResult, keysResult, metaResult] = await Promise.all([
        this.getNode
          .execute(nodeMeta, { useCache: true })
          .then((result) => {
            LoadLogger.logEventRelativeToLoadTime('[LoadDocument] getNode')
            return result
          })
          .catch((error) => {
            throw new Error(`Failed to load node: ${error}`)
          }),
        this.getDocumentKeys
          .execute(nodeMeta, { useCache: true })
          .then((result) => {
            LoadLogger.logEventRelativeToLoadTime('[LoadDocument] getDocumentKeys')
            return result
          })
          .catch((error) => {
            throw new Error(`Failed to load keys: ${error}`)
          }),
        this.loadMetaAndCommit
          .execute(nodeMeta)
          .then((result) => {
            LoadLogger.logEventRelativeToLoadTime('[LoadDocument] Loaded meta and encrypted commit')
            return result
          })
          .catch((error) => {
            throw new Error(`Failed to fetch document metadata: ${error}`)
          }),
      ])

      LoadLogger.logEventRelativeToLoadTime('[LoadDocument] All network requests')

      if (metaResult.isFailed()) {
        return DynamicResult.fail({
          message: metaResult.getErrorObject().message,
          code: metaResult.getErrorObject().code,
        })
      }
      if (nodeResult.isFailed()) {
        return DynamicResult.fail({ message: nodeResult.getError() })
      }
      if (keysResult.isFailed()) {
        return DynamicResult.fail({ message: keysResult.getError() })
      }

      const { keys } = keysResult.getValue()
      const { node, fromCache: nodeIsFromCache } = nodeResult.getValue()
      const { serverBasedMeta, latestCommit: encryptedCommit, realtimeTokenResult } = metaResult.getValue()
      const realtimeToken = realtimeTokenResult.isFailed() ? undefined : realtimeTokenResult.getValue()

      let userRole: DocumentRole | undefined = undefined
      if (realtimeToken?.token) {
        const jwtPayload = realtimeTokenPayloadSchema.parse(jwtDecode(realtimeToken.token))
        userRole = rawPermissionToRole(jwtPayload.Permissions)
      } else {
        const needsReadonlyMode =
          realtimeTokenResult.isFailed() &&
          realtimeTokenResult.getErrorObject().code === DocsApiErrorCode.NeedsReadonlyMode
        if (needsReadonlyMode) {
          userRole = new DocumentRole('Viewer')
        }
      }

      if (!userRole) {
        return DynamicResult.fail({ message: 'Unable to determine user role' })
      }

      let decryptedCommit: DecryptedCommit | undefined

      const commitId = serverBasedMeta.latestCommitId()

      if (encryptedCommit && commitId) {
        const decryptResult = await this.decryptCommit.execute({
          commit: encryptedCommit,
          commitId,
          documentContentKey: keys.documentContentKey,
        })

        if (decryptResult.isFailed()) {
          return DynamicResult.fail({ message: `Failed to decrypt commit ${decryptResult.getError()}` })
        }

        decryptedCommit = decryptResult.getValue()
      }

      if (!keysResult) {
        return DynamicResult.fail({ message: 'Unable to load all necessary data' })
      }

      const entitlements: DocumentEntitlements = {
        keys,
        nodeMeta,
      }

      const documentState = new DocumentState({
        ...DocumentState.defaults,
        documentMeta: serverBasedMeta,
        currentCommitId: serverBasedMeta.latestCommitId(),
        userRole,
        entitlements,
        baseCommit: decryptedCommit,
        decryptedNode: node,
        documentName: node.name,
        documentTrashState: node.trashed ? 'trashed' : 'not_trashed',
        realtimeConnectionToken: realtimeToken?.token,
        currentDocumentEmailDocTitleEnabled: realtimeToken?.preferences.includeDocumentNameInEmails ?? false,
      })

      if (nodeIsFromCache) {
        void this.getNode.execute(nodeMeta, { useCache: false }).then((result) => {
          if (result.isFailed()) {
            this.logger.error('Failed to load node from network', result.getError())
          } else {
            const node = result.getValue().node
            documentState.setProperty('decryptedNode', node)
            documentState.setProperty('documentTrashState', node.trashed ? 'trashed' : 'not_trashed')
            documentState.setProperty('documentName', node.name)
          }
        })
      }

      return DynamicResult.ok({ documentState })
    } catch (error) {
      return DynamicResult.fail({ message: getErrorString(error) ?? 'Failed to load document' })
    }
  }

  async executePublic(
    nodeMeta: PublicNodeMeta,
    publicEditingEnabled: boolean,
  ): Promise<Result<LoadDocumentResult<PublicDocumentState>>> {
    const compat = this.compatWrapper.getCompat<PublicDriveCompat>()
    const permissions = compat.permissions

    if (!permissions) {
      return Result.fail('Permissions not yet loaded')
    }

    try {
      const [nodeResult, keysResult, metaResult] = await Promise.all([
        this.getNode.execute(nodeMeta, { useCache: false }).catch((error) => {
          throw new Error(`Failed to load public node: ${error}`)
        }),
        compat.getDocumentKeys(nodeMeta).catch((error) => {
          throw new Error(`Failed to load public keys: ${error}`)
        }),
        this.loadMetaAndCommit.execute(nodeMeta).catch((error) => {
          throw new Error(`Failed to fetch document metadata: ${error}`)
        }),
      ])

      if (metaResult.isFailed()) {
        return Result.fail(metaResult.getErrorObject().message)
      }

      const { serverBasedMeta, latestCommit, realtimeTokenResult } = metaResult.getValue()
      if (!serverBasedMeta) {
        return Result.fail('Document meta not found')
      }

      const realtimeToken = realtimeTokenResult.isFailed() ? undefined : realtimeTokenResult.getValue()

      if (!keysResult) {
        return Result.fail('Unable to load all necessary data')
      }

      /**
       * We attempt to determine if the current public session user can load the actual document meta via the
       * authenticated API.
       *
       * If it succeeds, this means the user has some sort of access to this document, and can perform
       * actions like duplicating it.
       */
      const authenticatedMetaAttempt = await this.getDocumentMeta.execute({
        volumeId: serverBasedMeta.volumeId,
        linkId: nodeMeta.linkId,
      })

      const doesHaveAccessToDoc = !authenticatedMetaAttempt.isFailed()

      const role = (() => {
        if (publicEditingEnabled && getCanWrite(permissions)) {
          return new DocumentRole(doesHaveAccessToDoc ? 'PublicEditorWithAccess' : 'PublicEditor')
        }
        if (doesHaveAccessToDoc) {
          return new DocumentRole('PublicViewerWithAccess')
        }
        return new DocumentRole('PublicViewer')
      })()

      const entitlements: PublicDocumentEntitlements = {
        keys: keysResult,
        nodeMeta,
      }

      const latestCommitId = serverBasedMeta.latestCommitId()
      let decryptedCommit: DecryptedCommit | undefined

      if (latestCommit && latestCommitId) {
        const decryptResult = await this.decryptCommit.execute({
          commit: latestCommit,
          commitId: latestCommitId,
          documentContentKey: entitlements.keys.documentContentKey,
        })
        if (decryptResult.isFailed()) {
          return Result.fail(decryptResult.getError())
        }

        decryptedCommit = decryptResult.getValue()
        this.logger.info(`Downloaded and decrypted commit with ${decryptedCommit?.numberOfMessages()} updates`)
      }

      const decryptedNode = nodeResult.getValue().node

      const documentState = new PublicDocumentState({
        ...DocumentState.defaults,
        realtimeEnabled: publicEditingEnabled,
        documentMeta: serverBasedMeta,
        userRole: role,
        decryptedNode: decryptedNode,
        entitlements,
        documentName: decryptedNode.name,
        currentCommitId: serverBasedMeta.latestCommitId(),
        baseCommit: decryptedCommit,
        documentTrashState: decryptedNode.trashed ? 'trashed' : 'not_trashed',
        realtimeConnectionToken: realtimeToken?.token,
        currentDocumentEmailDocTitleEnabled: realtimeToken?.preferences.includeDocumentNameInEmails ?? false,
      })

      return Result.ok({ documentState, preferences: realtimeToken?.preferences })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to load document')
    }
  }
}
