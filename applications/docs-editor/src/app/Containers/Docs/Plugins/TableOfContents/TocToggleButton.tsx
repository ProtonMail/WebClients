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
        'relative flex shrink-0 rounded-r-full bg-[--background-norm] p-2.5',
        !isExpanded && 'border border-l-0 border-[--border-weak] shadow-[shadow:--shadow-raised]',
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
