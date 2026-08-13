import LabelStack from '@proton/components/components/labelStack/LabelStack';
import { c } from 'ttag'
import clsx from '@proton/utils/clsx'
import { IcCross } from '@proton/icons/icons/IcCross'
import { IcListBullets } from '@proton/icons/icons/IcListBullets'

const TOC_TOGGLE_TEST_ID = 'toc-toggle'

const toggleButtonClassName = 'relative flex shrink-0 rounded-r-full p-2.5 bg-norm'

interface TocButtonProps {
  onClick: () => void
  showNewTag?: boolean
}

export function TocOpenButton({ onClick, showNewTag = false }: TocButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={c('Action').t`Open outline`}
      className={clsx(toggleButtonClassName, 'shadow-raised border-weak border border-l-0')}
      data-testid={TOC_TOGGLE_TEST_ID}
    >
      {showNewTag && (
        <LabelStack
          labels={[{ title: c('Info').t`NEW`, name: c('Info').t`NEW`, color: '#179FD9' }]}
          className="absolute left-full top-0 -translate-x-1/4 -translate-y-2"
        />
      )}
      <IcListBullets />
    </button>
  )
}

export function TocCloseButton({ onClick }: TocButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={c('Action').t`Close outline`}
      className={clsx(toggleButtonClassName)}
      data-testid={TOC_TOGGLE_TEST_ID}
    >
      <IcCross />
    </button>
  )
}
