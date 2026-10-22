import { clsx } from 'clsx'
import { useDocsMessages } from '../../DocsDependenciesProvider'
import { useLocalStorageFlag } from '../../Utils/useLocalStorageFlag'
import { TocToggleButton } from './TocToggleButton'

const TOC_NEW_TAG_STORAGE_KEY = 'docs-toc-new-tag'

interface TocHeaderProps {
  isExpanded: boolean
  onToggle: () => void
}

export function TocHeader({ isExpanded, onToggle }: TocHeaderProps) {
  const messages = useDocsMessages().tableOfContents
  const [isNewTagDismissed, dismissNewTag] = useLocalStorageFlag(TOC_NEW_TAG_STORAGE_KEY)

  function handleToggle() {
    dismissNewTag()
    onToggle()
  }

  return (
    <div
      className={clsx(
        'toc-header relative flex flex-nowrap items-center gap-2 p-2.5 pl-0 pt-9',
        isExpanded && 'ml-[-22px]',
      )}
    >
      <TocToggleButton isExpanded={isExpanded} onClick={handleToggle} showNewTag={!isNewTagDismissed} />
      <span className="toc-header-title text-weak z-10 truncate text-sm font-medium">{messages.outline}</span>
    </div>
  )
}
