import { c } from 'ttag'

import type { HomepageViewState } from './homepageViewContext'
import { useHomepageView } from './homepageViewContext'

export function useHomepageTitle() {
  const { state } = useHomepageView()

  return titleByViewState(state)
}

function titleByViewState(state: HomepageViewState): string {
  switch (state.view) {
    case 'search-initial':
    case 'search-loading':
    case 'search-empty':
    case 'search':
      return `${c('Page title').t`Searching`} "${state.query}"`
    case 'recents-initial':
    case 'recents-empty':
    case 'recents-loading':
    case 'recents':
      return c('Page title').t`Recents`
    case 'trash-loading':
    case 'trash-empty':
    case 'trash':
      return c('Page title').t`Trash`
    case 'unknown':
      return ''
  }
}
