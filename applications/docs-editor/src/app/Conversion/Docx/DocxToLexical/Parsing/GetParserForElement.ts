import type { OpenXmlElement, WordDocument } from 'docx-preview-cjs'
import { CellParser } from './Parsers/CellParser'
import type { DocxElementParser } from './Parsers/DocxElementParser'
import { DrawingParser } from './Parsers/DrawingParser'
import { HyperlinkParser } from './Parsers/HyperlinkParser'
import { ParagraphParser } from './Parsers/ParagraphParser'
import { RowParser } from './Parsers/RowParser'
import { RunParser } from './Parsers/RunParser'
import { TableParser } from './Parsers/TableParser'
import { VmlParser } from './Parsers/VmlParser'

export function GetParserForElement(element: OpenXmlElement, doc: WordDocument): DocxElementParser | undefined {
  switch (element.type) {
    case 'cell':
      return new CellParser(element, doc)
    case 'row':
      return new RowParser(element, doc)
    case 'table':
      return new TableParser(element, doc)
    case 'drawing':
      return new DrawingParser(element, doc)
    case 'vmlElement':
    case 'vmlPicture':
      return new VmlParser(element, doc)
    case 'run':
      return new RunParser(element, doc)
    case 'hyperlink':
      return new HyperlinkParser(element, doc)
    case 'paragraph':
      return new ParagraphParser(element, doc)
    default:
      break
  }

  // eslint-disable-next-line no-console
  console.log('No parser found for element', element.type)

  return undefined
}
