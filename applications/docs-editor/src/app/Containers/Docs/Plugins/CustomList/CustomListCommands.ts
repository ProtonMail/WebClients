import { createCommand } from 'lexical'
import type { CustomListMarker, CustomListStyleType } from './CustomListTypes'

export const INSERT_CUSTOM_ORDERED_LIST_COMMAND = createCommand<{
  type?: CustomListStyleType
  marker?: CustomListMarker
}>('INSERT_CUSTOM_ORDERED_LIST_COMMAND')
