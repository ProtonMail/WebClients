import type { EditorThemeClasses } from 'lexical'

import './DocumentEditorTheme.scss'

const DocumentEditorTheme: EditorThemeClasses = {
  blockCursor: 'Lexical__blockCursor',
  characterLimit: 'Lexical__characterLimit',
  code: 'Lexical__code',
  codeHighlight: {
    atrule: 'Lexical__tokenAttr',
    attr: 'Lexical__tokenAttr',
    boolean: 'Lexical__tokenProperty',
    builtin: 'Lexical__tokenSelector',
    cdata: 'Lexical__tokenComment',
    char: 'Lexical__tokenSelector',
    class: 'Lexical__tokenFunction',
    'class-name': 'Lexical__tokenFunction',
    comment: 'Lexical__tokenComment',
    constant: 'Lexical__tokenProperty',
    deleted: 'Lexical__tokenProperty',
    doctype: 'Lexical__tokenComment',
    entity: 'Lexical__tokenOperator',
    function: 'Lexical__tokenFunction',
    important: 'Lexical__tokenVariable',
    inserted: 'Lexical__tokenSelector',
    keyword: 'Lexical__tokenAttr',
    namespace: 'Lexical__tokenVariable',
    number: 'Lexical__tokenProperty',
    operator: 'Lexical__tokenOperator',
    prolog: 'Lexical__tokenComment',
    property: 'Lexical__tokenProperty',
    punctuation: 'Lexical__tokenPunctuation',
    regex: 'Lexical__tokenVariable',
    selector: 'Lexical__tokenSelector',
    string: 'Lexical__tokenSelector',
    symbol: 'Lexical__tokenProperty',
    tag: 'Lexical__tokenProperty',
    url: 'Lexical__tokenOperator',
    variable: 'Lexical__tokenVariable',
  },
  embedBlock: {
    base: 'Lexical__embedBlock',
    focus: 'Lexical__embedBlockFocus',
  },
  hashtag: 'Lexical__hashtag',
  heading: {
    h1: 'Lexical__h1',
    h2: 'Lexical__h2',
    h3: 'Lexical__h3',
    h4: 'Lexical__h4',
    h5: 'Lexical__h5',
    h6: 'Lexical__h6',
  },
  image: 'Lexical__image',
  link: 'Lexical__link',
  list: {
    listitem: 'Lexical__listItem',
    listitemChecked: 'Lexical__listItemChecked',
    listitemUnchecked: 'Lexical__listItemUnchecked',
    nested: {
      listitem: 'Lexical__listItem--nested',
    },
    ol: 'Lexical__ol',
    olDepth: [
      'Lexical__ol--depth-1',
      'Lexical__ol--depth-2',
      'Lexical__ol--depth-3',
      'Lexical__ol--depth-4',
      'Lexical__ol--depth-5',
    ],
    ul: 'Lexical__ul',
    ulDepth: [
      'Lexical__ul--depth-1',
      'Lexical__ul--depth-2',
      'Lexical__ul--depth-3',
      'Lexical__ul--depth-4',
      'Lexical__ul--depth-5',
    ],
    checklist: 'Lexical__checkList',
  },
  ltr: 'Lexical__ltr',
  mark: 'Lexical__mark',
  markOverlap: 'Lexical__markOverlap',
  paragraph: 'Lexical__paragraph',
  quote: 'Lexical__quote',
  rtl: 'Lexical__rtl',
  table: 'Lexical__table',
  tableScrollableWrapper: 'Lexical__tableWrapper',
  tableAddColumns: 'Lexical__tableAddColumns',
  tableAddRows: 'Lexical__tableAddRows',
  tableCell: 'Lexical__tableCell',
  tableCellActionButton: 'Lexical__tableCellActionButton',
  tableCellActionButtonContainer: 'Lexical__tableCellActionButtonContainer',
  tableCellEditing: 'Lexical__tableCellEditing',
  tableCellHeader: 'Lexical__tableCellHeader',
  tableCellPrimarySelected: 'Lexical__tableCellPrimarySelected',
  tableCellResizer: 'Lexical__tableCellResizer',
  tableCellSelected: 'Lexical__tableCellSelected',
  tableCellSortedIndicator: 'Lexical__tableCellSortedIndicator',
  tableResizeRuler: 'Lexical__tableCellResizeRuler',
  tableSelected: 'Lexical__tableSelected',
  tableSelection: 'Lexical__tableSelection',
  hr: 'Lexical__divider',
  text: {
    bold: 'Lexical__textBold',
    code: 'Lexical__textCode',
    italic: 'Lexical__textItalic',
    strikethrough: 'Lexical__textStrikethrough',
    subscript: 'Lexical__textSubscript',
    superscript: 'Lexical__textSuperscript',
    underline: 'Lexical__textUnderline',
    underlineStrikethrough: 'Lexical__textUnderlineStrikethrough',
  },
}

export default DocumentEditorTheme
