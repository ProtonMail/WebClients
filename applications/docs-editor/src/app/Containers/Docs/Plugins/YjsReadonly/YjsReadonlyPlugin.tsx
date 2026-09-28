import type { Doc } from 'yjs'

import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { Provider } from '@lexical/yjs'
import { useMemo } from 'react'

import { useYjsReadonly } from './useYjsReadonly'
import type { LoggerInterface } from '@proton/shared/lib/logs'

type Props = {
  id: string
  providerFactory: (id: string, yjsDocMap: Map<string, Doc>) => Provider
  lexicalError?: Error
  logger: LoggerInterface
  onEditorReadyToReceiveUpdates: () => void
  safeMode: boolean
}

export function YjsReadonlyPlugin({
  id,
  providerFactory,
  onEditorReadyToReceiveUpdates,
  safeMode,
  lexicalError,
  logger,
}: Props): null {
  const collabContext = useCollaborationContext()

  const { yjsDocMap } = collabContext

  const [editor] = useLexicalComposerContext()

  const provider = useMemo(() => providerFactory(id, yjsDocMap), [id, providerFactory, yjsDocMap])

  const binding = useYjsReadonly(
    editor,
    id,
    provider,
    yjsDocMap,
    onEditorReadyToReceiveUpdates,
    logger,
    safeMode,
    lexicalError,
  )

  collabContext.clientID = binding.clientID

  return null
}
