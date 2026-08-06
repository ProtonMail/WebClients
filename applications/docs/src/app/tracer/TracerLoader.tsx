import { useState } from 'react'
import type { PropsWithChildren } from 'react'
import OpenTracer from '@proton/docs-shared/lib/Tracer/Module'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { isDevOrBlack } from '@proton/utils/env'

// enable tracer on all environment except for dev and black
const ENABLE_TRACER = !isDevOrBlack()

// app will take 2 seconds max to load in case of indexdb load hangup
const MAX_TRACER_LOAD = 2000

export default function TracerLoader({ children }: PropsWithChildren) {
  const [doRender, setDoRender] = useState(!ENABLE_TRACER)

  useEffectOnce(() => {
    if (ENABLE_TRACER) {
      OpenTracer.setEnabled(true)

      void Promise.race([OpenTracer.init(), new Promise((_, reject) => setTimeout(reject, MAX_TRACER_LOAD))])
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
