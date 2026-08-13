import useLocalState from '@proton/components/hooks/useLocalState';
import { c } from 'ttag'
import { TocCloseButton, TocOpenButton } from './TocToggleButton'
import clsx from '@proton/utils/clsx'

const TOC_NEW_TAG_STORAGE_KEY = 'docs-toc-new-tag'

interface TocHeaderProps {
  isActive: boolean
  onToggle: () => void
}

export function TocHeader({ isActive, onToggle }: TocHeaderProps) {
  const title = c('Title').t`Outline`
  const [isNewTagDismissed, setIsNewTagDismissed] = useLocalState(false, TOC_NEW_TAG_STORAGE_KEY)

  function handleToggle() {
    setIsNewTagDismissed(true)
    onToggle()
  }

  return (
    <div className={clsx('toc-header relative flex items-center gap-2 p-2.5 pl-0 pt-9', isActive && 'ml-[-22px]')}>
      {isActive ? (
        <TocCloseButton onClick={handleToggle} />
      ) : (
        <TocOpenButton onClick={handleToggle} showNewTag={!isNewTagDismissed} />
      )}
      <span className="toc-header-title text-weak z-10 truncate text-sm font-medium">{title}</span>
    </div>
  )
}
