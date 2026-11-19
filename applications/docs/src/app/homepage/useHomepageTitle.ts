import type { HomepageViewState } from './homepageViewContext'
import { useHomepageView } from './homepageViewContext'
import { useHomepageMessages } from './messages/HomepageMessagesProvider'
import type { HomepageMessages } from './messages/defaultHomepageMessages'

export function useHomepageTitle() {
  const { state } = useHomepageView()

  return titleByViewState(state, useHomepageMessages().pageTitle)
}

function titleByViewState(state: HomepageViewState, messages: HomepageMessages['pageTitle']): string {
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
