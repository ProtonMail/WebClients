import type { ListType } from '@lexical/list'
import type { CustomListMarker, CustomListStyleType } from './CustomListTypes'
import { CustomListNode } from './CustomListNode'
import { $applyNodeReplacement } from 'lexical'

export function $createCustomListNode(
  listType: ListType,
  start = 1,
  listStyleType?: CustomListStyleType,
  listMarker?: CustomListMarker,
): CustomListNode {
  return $applyNodeReplacement(new CustomListNode(listType, start, listStyleType, listMarker))
}
