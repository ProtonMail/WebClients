import { OfferRenewNoticeProvider } from '@proton/payments-ui/ui/components/OfferRenewNoticeProvider'

import { HomepageContent } from '~/homepage'
import { HomepageAdapter } from '../__components/HomepageAdapter'
import { HomepageShell } from '../__components/HomepageShell'

export default function HomepagePage() {
  return (
    <HomepageAdapter>
      <OfferRenewNoticeProvider>
        <HomepageShell>
          <HomepageContent />
        </HomepageShell>
      </OfferRenewNoticeProvider>
    </HomepageAdapter>
  )
}
