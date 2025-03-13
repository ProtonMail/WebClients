import type { RecentDocumentItem } from '@proton/docs-core'
import { filterItem } from './filterItem'

export const filterItems = (items?: RecentDocumentItem[], searchText?: string, filter?: string) => {
  if (!items || items.length === 0 || !(searchText || filter)) {
    return items || []
  }

  let newFilteredItems = items

  if (searchText) {
    newFilteredItems = newFilteredItems.filter((data) => data.name.toLowerCase().includes(searchText.toLowerCase()))
  }

  if (filter) {
    newFilteredItems = newFilteredItems.filter((item) => filterItem(item, filter))
  }

  return newFilteredItems
}
