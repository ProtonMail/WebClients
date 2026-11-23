import { c } from 'ttag'

import { Badge } from '@proton/components/components/badge/Badge'

export function BetaFeatureBadge() {
  return (
    <>
      {' '}
      <Badge type="origin" className="color-weak -my-px ml-1 shrink-0 align-top" data-testid="beta-feature-badge">
        {c('Info').t`Beta`}
      </Badge>
    </>
  )
}
