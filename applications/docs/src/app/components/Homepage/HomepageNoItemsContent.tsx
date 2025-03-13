import { c } from 'ttag'
import { ButtonLike } from '@proton/atoms'
import { Icon } from '@proton/components'
import noContentImg from './HomepageNoDocuments.svg'
import { useRecentDocuments } from './useRecentDocuments'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'

export function HomepageNoItemsContent() {
  const { getLocalID } = useRecentDocuments()

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex-column flex items-center gap-8 py-8">
        <img
          className="w-custom"
          style={{ '--w-custom': '130px' }}
          src={noContentImg}
          alt={c('Info').t`No recent documents`}
        />
        <div className="w-custom text-center" style={{ '--w-custom': '400px' }}>
          <span className="text-bold text-2xl">{c('Info').t`Create your end-to-end encrypted document`}</span>
        </div>
        <div className="flex justify-center">
          <ButtonLike
            as="a"
            href={getAppHref('/doc', APPS.PROTONDOCS, getLocalID())}
            target="_blank"
            color="norm"
            size="large"
            shape="solid"
            style={{ backgroundColor: 'var(--docs-blue-color)' }}
            className="flex items-center justify-center gap-2"
          >
            <Icon name="plus" />
            {c('Action').t`New document`}
          </ButtonLike>
        </div>
      </div>
    </div>
  )
}
