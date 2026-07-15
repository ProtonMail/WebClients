import { useState } from 'react'
import type { PropsWithChildren } from 'react'
import OpenTracer from '@proton/docs-shared/lib/Tracer/Module'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { isDevOrBlack } from '@proton/utils/env'
import { versionCookieAtLoad } from '@proton/components/helpers/versionCookie'

export default function TracerLoader({ children }: PropsWithChildren) {
  const enableTracer = versionCookieAtLoad === 'alpha' || isDevOrBlack()
  const [doRender, setDoRender] = useState(!enableTracer)

  useEffectOnce(() => {
    if (enableTracer) {
      OpenTracer.setEnabled(true)
      void OpenTracer.init()
        .then(() => setDoRender(true))
        .catch(() => {
          OpenTracer.setEnabled(false)
          setDoRender(true)
        })
    }
  })

  if (!doRender) {
    return null
  }

  return children
}
