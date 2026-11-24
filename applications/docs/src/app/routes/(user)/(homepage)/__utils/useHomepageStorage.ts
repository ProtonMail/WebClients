import { useMemo } from 'react'

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks'
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks'
import { useUser } from '@proton/account/user/hooks'
import { getSubscriptionForApp } from '@proton/payments/core/subscription/subscription-for-app'
import { getUpgradePath } from '@proton/payments/core/subscription/upsell'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper'
import { APPS, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants'
import { getIsIframe } from '@proton/shared/lib/helpers/browser'
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/ref'
import { getAppSpace, getCanAddStorage, getSpace } from '@proton/shared/lib/user/storage'

import type { HomepageStorage } from '~/homepage'

/**
 * The data of the storage meter that Proton's `Sidebar` showed (its `Storage`, in
 * packages/components/components/sidebar/Sidebar.tsx), for the homepage's own sidebar. `upgradeHref` and
 * `openUpgradeInNewTab` are the link and target of its `SettingsLink` to the upgrade, as `AppLink` builds them in SSO
 * mode.
 */
export function useHomepageStorage(localID: number | undefined): HomepageStorage | undefined {
  const [user] = useUser()
  // `useSubscriptionForApp(APPS.PROTONDOCS)` of `@proton/payments-hooks`, which the Docs app doesn't depend on.
  const [allSubscriptions] = useAllSubscriptions()
  const [entitlementCatalog] = useEntitlementCatalog()

  return useMemo(() => {
    if (!user) {
      return undefined
    }
    const subscription = getSubscriptionForApp(allSubscriptions ?? [], entitlementCatalog, APPS.PROTONDOCS)
    const { usedSpace, maxSpace } = getAppSpace(getSpace(user), APPS.PROTONDOCS)
    if (!getCanAddStorage({ user, subscription })) {
      return { usedSpace, maxSpace }
    }
    const upsellRef = getUpsellRefFromApp({
      app: APPS.PROTONDOCS,
      feature: SHARED_UPSELL_PATHS.STORAGE,
      component: UPSELL_COMPONENT.BUTTON,
      fromApp: APPS.PROTONDOCS,
    })
    const slug = getSlugFromApp(APPS.PROTONDOCS)
    const path = `${slug ? `/${slug}` : ''}${getUpgradePath({ user, subscription }, upsellRef)}`
    return {
      usedSpace,
      maxSpace,
      upgradeHref: getAppHref(path, APPS.PROTONACCOUNT, localID),
      // `SettingsLink` opens the Docs settings in this tab (`canOpenInSameTab`), unless the app is in an iframe.
      openUpgradeInNewTab: getIsIframe(),
    }
  }, [user, allSubscriptions, entitlementCatalog, localID])
}
