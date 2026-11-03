import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { version as realtimeSdkVersion } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'

export default function DocumentPageV2() {
  const application = useApplication()

  useEffectOnce(() => {
    application.logger.info('Document page v2 on realtime SDK', { realtimeSdkVersion })
  })

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8">
      <MimeProtonDoc size={9} className="shrink-0" />
      <CircleLoader size="medium" />
    </div>
  )
}
