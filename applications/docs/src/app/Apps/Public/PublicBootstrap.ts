import * as bootstrap from '@proton/account/bootstrap'
import createApi from '@proton/shared/lib/api/createApi'
import type { ProtonConfig } from '@proton/shared/lib/interfaces'

import locales from '../../locales'
import { extendStore, setupStore } from '../../ReduxStore/store'

export const bootstrapPublicApp = async ({ config }: { config: ProtonConfig }) => {
  const authentication = bootstrap.createAuthentication({ initialAuth: false })
  bootstrap.init({ config, locales, authentication })

  const store = setupStore()
  const api = createApi({ config })
  extendStore({ config, api, authentication })

  const searchParams = new URLSearchParams(location.search)
  await bootstrap.publicApp({ app: config.APP_NAME, locales, searchParams, pathLocale: '' })

  return { store }
}
