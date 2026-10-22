import { clsx } from 'clsx'
import { Badge } from '../../Components/atoms'
import { Icon } from '../../Components/Icon'
import * as Icons from '../../Components/icons'
import { useDocsMessages } from '../../DocsDependenciesProvider'

interface TocToggleButtonProps {
  isExpanded: boolean
  onClick: () => void
  showNewTag: boolean
}

export function TocToggleButton({ isExpanded, onClick, showNewTag }: TocToggleButtonProps) {
  const messages = useDocsMessages().tableOfContents

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isExpanded ? messages.closeOutline : messages.openOutline}
      aria-expanded={isExpanded}
      className={clsx(
        'bg-norm relative flex shrink-0 rounded-r-full p-2.5',
        !isExpanded && 'shadow-raised border-weak border border-l-0',
      )}
      data-testid="toc-toggle"
    >
      {showNewTag && (
        <Badge className="absolute left-full top-0 -translate-x-1/4 -translate-y-2">{messages.newBadge}</Badge>
      )}
      <Icon data={isExpanded ? Icons.cross : Icons.listBullets} />
    </button>
  )
}
