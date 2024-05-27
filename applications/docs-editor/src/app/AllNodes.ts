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

const CommonNodes = [
  AutoLinkNode,
  CodeHighlightNode,
  CodeNode,
  HashtagNode,
  HeadingNode,
  HorizontalRuleNode,
  LinkNode,
  ListItemNode,
  OverflowNode,
  QuoteNode,
  TableCellNode,
  TableNode,
  TableRowNode,
  ListNode,
  ImageNode,
  CommentThreadMarkNode,
]

export const AllNodes = CommonNodes

export const BlockEditorNodes = CommonNodes
