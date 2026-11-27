import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'

export const DOCS_SIGNUP = getAppHref('/docs/signup', APPS.PROTONACCOUNT)
export const DOCS_SIGNIN = getAppHref('/docs', APPS.PROTONACCOUNT)
