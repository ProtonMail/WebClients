import { CircleLoader } from '@proton/atoms'
import type { FileToDocConversionResult } from '@proton/docs-core'
import type { Result } from '@proton/docs-shared'
import type { DecryptedNode, NodeMeta } from '@proton/drive-store'
import useLoading from '@proton/hooks/useLoading'
import { useCallback, useEffect, useState } from 'react'
import { c } from 'ttag'
import { useApplication } from '~/utils/application-context'

export type DocumentConverterProps = {
  lookup: NodeMeta
  onSuccess: (result: FileToDocConversionResult) => void
  getNodeContents: (meta: NodeMeta) => Promise<{ contents: Uint8Array<ArrayBuffer>; node: DecryptedNode }>
}

export function DocumentConverter({ lookup, onSuccess, getNodeContents }: DocumentConverterProps) {
  const application = useApplication()

  const [isConverting, setIsConverting] = useState(false)
  const [conversionResult, setConversionResult] = useState<Result<FileToDocConversionResult> | null>(null)

  const [isLoading, withLoading] = useLoading()
  const [contents, setContents] = useState<Uint8Array<ArrayBuffer> | null>(null)
  const [node, setNode] = useState<DecryptedNode | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    void withLoading(
      getNodeContents(lookup)
        .then(({ contents, node }) => {
          setError(null)
          setContents(contents)
          setNode(node)
        })
        .catch((e: Error) => {
          setError(e)
          setContents(null)
          setNode(null)
        }),
    )
  }, [lookup, getNodeContents, withLoading])

  const performConversion = useCallback(async () => {
    if (isConverting || conversionResult) {
      return
    }

    if (contents && node) {
      setIsConverting(true)

      const result = await application.createEmptyDocumentForConversionUseCase.execute({
        node,
        contents,
      })

      setConversionResult(result)

      setIsConverting(false)

      if (!result.isFailed()) {
        onSuccess(result.getValue())
      }
    }
  }, [isConverting, conversionResult, contents, node, application.createEmptyDocumentForConversionUseCase, onSuccess])

  useEffect(() => {
    if (!isConverting) {
      void performConversion()
    }
  }, [performConversion, isConverting])

  const isConversionFailed = conversionResult && conversionResult.isFailed()
  const errorMessage = isConversionFailed && conversionResult.getError()
  const errorDetail = error ? `: ${error?.message}` : ''

  if (isConversionFailed || isConverting || contents === null || node === null || isLoading) {
    return (
      <div className="flex-column flex h-full w-full items-center justify-center gap-4">
        {(isConverting || isLoading) && <CircleLoader size="large" />}
        <div className="text-center">
          {isConversionFailed &&
            // translator: the variable is a javascript error message
            c('Info').jt`Error converting document: ${errorMessage}`}
          {isConverting && c('Info').t`Converting document...`}
          {isLoading && !isConverting && c('Info').t`Loading...`}
          {isLoading === false &&
            error != null &&
            // translator: the variable is a javascript error message
            c('Info').jt`Error loading document: ${errorDetail}`}
        </div>
      </div>
    )
  }

  return null
}
