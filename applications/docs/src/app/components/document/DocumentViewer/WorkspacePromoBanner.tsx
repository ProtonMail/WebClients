import { useCallback, useEffect, useMemo, useState } from 'react'

import { useUser } from '@proton/account/user/hooks'
import { useUserSettings } from '@proton/account/userSettings/hooks'
import { Button } from '@proton/atoms/Button/Button'
import { ButtonLike } from '@proton/atoms/Button/ButtonLike'
import { IcBriefcase } from '@proton/icons/icons/IcBriefcase'
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { hasBit } from '@proton/shared/lib/helpers/bitset'
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter'
import { getItem, setItem } from '@proton/shared/lib/helpers/storage'
import { c } from 'ttag'

const MINIMUM_ACCOUNT_AGE_IN_DAYS = 30
const WORKSPACE_PROMO_MONTHS = new Set([2, 5, 8, 11])
const WORKSPACE_PROMO_SIGNUP_PATH = '/drive/signup/business?billing=12&trial=true'
const WORKSPACE_PROMO_STORAGE_KEY_PREFIX = 'docs-workspace-promo-banner-dismissed'

export function WorkspacePromoBanner() {
  const { handleDismiss, shouldShow, signupUrl } = useWorkspacePromoBanner()

  if (!shouldShow) {
    return null
  }

  return (
    <div
      className="z-10 flex h-[52px] shrink-0 items-center justify-between gap-4 bg-[#c0e3f2] px-6 text-[#14688d] head-max-1199:![display:none]"
      data-testid="workspace-promo-banner"
    >
      <div className="flex min-w-0 items-center gap-2">
        <IcBriefcase size={5} className="shrink-0" />
        <span className="truncate text-sm font-medium leading-5">
          {c('Info')
            .t`Get a professional @your-company.com email, 1 TB of secure storage per user, longer video calls, and more with ${BRAND_NAME} Workspace.`}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ButtonLike
          as="a"
          className="!h-7 !border-0 !bg-[#a9d8eb] !px-3 !text-[#14688d] hover:!bg-[#9fd0e4]"
          shape="solid"
          size="small"
          href={signupUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {c('Action').t`Try Workspace`}
        </ButtonLike>
        <Button
          className="!bg-transparent !h-7 !border-0 !px-3 !text-[#14688d] hover:!bg-[#a9d8eb]"
          shape="ghost"
          size="small"
          onClick={handleDismiss}
        >
          {c('Action').t`Maybe later`}
        </Button>
      </div>
    </div>
  )
}

function useWorkspacePromoBanner() {
  const [user] = useUser()
  const [userSettings, loadingUserSettings] = useUserSettings()
  const now = useMemo(() => new Date(), [])
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const storageKey = `${WORKSPACE_PROMO_STORAGE_KEY_PREFIX}-${user.ID}-${monthKey}`
  const [isDismissed, setIsDismissed] = useState(() => getItem(storageKey) === '1')

  useEffect(() => {
    setIsDismissed(getItem(storageKey) === '1')
  }, [storageKey])

  const handleDismiss = useCallback(() => {
    setItem(storageKey, '1')
    setIsDismissed(true)
  }, [storageKey])

  const accountAgeInDays = user.CreateTime ? (now.getTime() - user.CreateTime * 1000) / (24 * 60 * 60 * 1000) : 0
  const shouldShow =
    !loadingUserSettings &&
    !isDismissed &&
    user.isFree &&
    WORKSPACE_PROMO_MONTHS.has(now.getMonth()) &&
    hasBit(userSettings.News, NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS) &&
    accountAgeInDays >= MINIMUM_ACCOUNT_AGE_IN_DAYS

  return {
    handleDismiss,
    shouldShow,
    signupUrl: getAppHref(WORKSPACE_PROMO_SIGNUP_PATH, APPS.PROTONACCOUNT),
  }
}
