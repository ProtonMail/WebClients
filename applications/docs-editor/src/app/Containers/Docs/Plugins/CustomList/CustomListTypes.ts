import type { SerializedListNode } from '@lexical/list'
import type { Spread } from 'lexical'

export type CustomListStyleType = 'lower-alpha' | 'upper-alpha' | 'upper-roman'
export type CustomListDOMType = 'a' | 'A' | 'I'
export type CustomListMarker = 'period' | 'bracket'
export type SerializedCustomListNode = Spread<
  {
    listStyleType?: CustomListStyleType
    listMarker?: CustomListMarker
  },
  SerializedListNode
>
