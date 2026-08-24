import { Button } from '@proton/atoms/Button/Button'
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus'
import { c } from 'ttag'

// onClick can be undefined just because authenticatedController in the layer above
export function HeaderShareButton({ onClick }: { onClick: (() => void) | undefined }) {
  return (
    <Button
      shape="ghost"
      className="flex flex-nowrap items-center gap-2 border !border-[transparent] head-max-849:!mr-2 head-max-849:!border head-max-849:!border-[--border-norm] head-max-849:!px-[0.5em]"
      data-testid="share-button"
      onClick={onClick}
    >
      <IcUserPlus />
      <span className="leading-none head-max-849:!sr-only">{c('Action').t`Share`}</span>
    </Button>
  )
}
