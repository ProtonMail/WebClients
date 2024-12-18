import * as bootstrap from '@proton/account/bootstrap'
import type { ProtonConfig } from '@proton/shared/lib/interfaces'
import { setTtagLocales } from '@proton/shared/lib/i18n/locales'

import locales from '../locales'

export const bootstrapEditorApp = async ({ config }: { config: ProtonConfig }) => {
  setTtagLocales(locales)

  const authentication = bootstrap.createAuthentication({ initialAuth: false })
  bootstrap.init({ config, locales, authentication })

  const searchParams = new URLSearchParams(location.search)
  await bootstrap.publicApp({ app: config.APP_NAME, locales, searchParams, pathLocale: '' })
}
