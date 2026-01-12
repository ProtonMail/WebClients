import { useState, useEffect } from 'react'
import type { AppPlatform, EditorRequiresClientMethods } from '@proton/docs-shared'

export function useAppPlatform(clientInvoker: EditorRequiresClientMethods) {
  const [platform, setPlatform] = useState<AppPlatform | null>(null)

  useEffect(() => {
    let ignore = false
    clientInvoker
      .getAppPlatform()
      .then((platform) => {
        if (!ignore) {
          setPlatform(platform)
        }
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [clientInvoker])

  return platform
}
