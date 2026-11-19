import type { HomepageViewState } from './homepageViewContext'
import { useHomepageView } from './homepageViewContext'
import { createPageTitleMessages } from './messages/pageTitle'

export function useHomepageTitle() {
  const { state } = useHomepageView()

  return titleByViewState(state)
}

function titleByViewState(state: HomepageViewState): string {
  const messages = createPageTitleMessages().pageTitle
  switch (state.view) {
    case 'search-initial':
    case 'search-loading':
    case 'search-empty':
    case 'search':
      return `${messages.searching} "${state.query}"`
    case 'recents-initial':
    case 'recents-empty':
    case 'recents-loading':
    case 'recents':
      return messages.recents
    case 'trash-loading':
    case 'trash-empty':
    case 'trash':
      return messages.trash
    case 'unknown':
      return ''
  }
}
