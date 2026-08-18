import type { OpenXmlElement, WordDocument } from 'docx-preview-cjs'
import { CellParser } from './Parsers/CellParser'
import type { DocxElementParser, ParseDocxChildren } from './Parsers/DocxElementParser'
import { DrawingParser } from './Parsers/DrawingParser'
import { HyperlinkParser } from './Parsers/HyperlinkParser'
import { ParagraphParser } from './Parsers/ParagraphParser'
import { RowParser } from './Parsers/RowParser'
import { RunParser } from './Parsers/RunParser'
import { TableParser } from './Parsers/TableParser'
import { VmlParser } from './Parsers/VmlParser'

export function GetParserForElement(
  element: OpenXmlElement,
  doc: WordDocument,
  parseDocxChildren: ParseDocxChildren,
): DocxElementParser | undefined {
  switch (element.type) {
    case 'cell':
      return new CellParser(element, doc, parseDocxChildren)
    case 'row':
      return new RowParser(element, doc, parseDocxChildren)
    case 'table':
      return new TableParser(element, doc, parseDocxChildren)
    case 'drawing':
      return new DrawingParser(element, doc, parseDocxChildren)
    case 'vmlElement':
    case 'vmlPicture':
      return new VmlParser(element, doc, parseDocxChildren)
    case 'run':
      return new RunParser(element, doc, parseDocxChildren)
    case 'hyperlink':
      return new HyperlinkParser(element, doc, parseDocxChildren)
    case 'paragraph':
      return new ParagraphParser(element, doc, parseDocxChildren)
    default:
      break
  }

  // eslint-disable-next-line no-console
  console.log('No parser found for element', element.type)

  return undefined
}
