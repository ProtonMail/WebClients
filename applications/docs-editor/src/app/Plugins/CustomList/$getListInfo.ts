import { $isListNode, type ListItemNode, type ListNode, type ListType } from '@lexical/list'
import type { CustomListMarker, CustomListStyleType } from './CustomListTypes'
import { $isCustomListNode } from './$isCustomListNode'
import { $findMatchingParent } from '@lexical/utils'

export type ListInfo = {
  listType: ListType
  listStyleType?: CustomListStyleType
  listMarker?: CustomListMarker
}

export function $getListInfo(node: ListNode | ListItemNode): ListInfo {
  const list = $isListNode(node) ? node : $findMatchingParent(node, $isListNode)
  if (!list) {
    throw new Error('Could not find list')
  }

  const info: ListInfo = {
    listType: list.getListType(),
  }

  if ($isCustomListNode(list)) {
    info.listStyleType = list.getListStyleType()
    info.listMarker = list.getListMarker()
  }

  return info
}
