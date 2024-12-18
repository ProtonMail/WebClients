import type { Doc } from 'yjs'

import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { Provider } from '@lexical/yjs'
import { useMemo } from 'react'

import { useYjsReadonly } from './useYjsReadonly'
import type { EditorLoadResult } from '../../Lib/EditorLoadResult'
import type { LoggerInterface } from '@proton/utils/logs'

type Props = {
  id: string
  providerFactory: (
    // eslint-disable-next-line no-shadow
    id: string,
    yjsDocMap: Map<string, Doc>,
  ) => Provider
  lexicalError?: Error
  logger: LoggerInterface
  onLoadResult: EditorLoadResult
  safeMode: boolean
}

export function YjsReadonlyPlugin({ id, providerFactory, onLoadResult, safeMode, lexicalError, logger }: Props): null {
  const collabContext = useCollaborationContext()

  const { yjsDocMap } = collabContext

  const [editor] = useLexicalComposerContext()

  const provider = useMemo(() => providerFactory(id, yjsDocMap), [id, providerFactory, yjsDocMap])

  const binding = useYjsReadonly(editor, id, provider, yjsDocMap, onLoadResult, logger, safeMode, lexicalError)

  collabContext.clientID = binding.clientID

  return null
}
