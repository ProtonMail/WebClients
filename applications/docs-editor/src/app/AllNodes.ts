import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { HashtagNode } from '@lexical/hashtag'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { OverflowNode } from '@lexical/overflow'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { ImageNode } from './Containers/Docs/Plugins/Image/ImageNode'
import { CommentThreadMarkNode } from './Containers/Docs/Plugins/Comments/CommentThreadMarkNode'
import { CustomListNode } from './Containers/Docs/Plugins/CustomList/CustomListNode'
import { ProtonNode } from './Containers/Docs/Plugins/Suggestions/ProtonNode'
import { PageBreakNode } from './Containers/Docs/Plugins/PageBreak/PageBreakNode'

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
    withKlass: CustomListNode,
  },
  OverflowNode,
  PageBreakNode,
  QuoteNode,
  TableCellNode,
  TableNode,
  TableRowNode,
  ProtonNode,
]

export const AllNodes = CommonNodes
