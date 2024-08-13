import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { HashtagNode } from '@lexical/hashtag'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { OverflowNode } from '@lexical/overflow'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { ImageNode } from './Plugins/Image/ImageNode'
import { CommentThreadMarkNode } from './Plugins/Comments/CommentThreadMarkNode'
import { CustomListNode } from './Plugins/CustomList/CustomListNode'

const CommonNodes = [
  AutoLinkNode,
  CodeHighlightNode,
  CodeNode,
  CommentThreadMarkNode,
  HashtagNode,
  HeadingNode,
  HorizontalRuleNode,
  ImageNode,
  LinkNode,
  ListItemNode,
  ListNode,
  CustomListNode,
  {
    replace: ListNode,
    with: (node: ListNode) => {
      return new CustomListNode(node.__listType, node.__start)
    },
  },
  OverflowNode,
  QuoteNode,
  TableCellNode,
  TableNode,
  TableRowNode,
]

export const AllNodes = CommonNodes

export const BlockEditorNodes = CommonNodes
