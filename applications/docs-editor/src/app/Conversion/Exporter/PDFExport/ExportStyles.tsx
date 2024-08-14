import { StyleSheet } from '@react-pdf/renderer'
import { pixelsToPoints } from './LexicalNodeToPDFNode/Utils/pixelsToPoints'

export const BodyFontSizePx = 16

export const ExportStyles = StyleSheet.create({
  page: {
    paddingVertical: 35,
    paddingLeft: 35,
    paddingRight: 45,
    lineHeight: 1.3,
    fontSize: pixelsToPoints(BodyFontSizePx),
    gap: 14,
  },
  block: {
    gap: 14,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  listMarker: {
    flexShrink: 0,
    height: '100%',
    marginRight: 2,
  },
  collapsibleTitle: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingTop: 4,
    paddingBottom: 2,
    paddingHorizontal: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  quote: {
    borderLeftWidth: 4,
    color: 'rgba(46, 46, 46)',
    borderLeftColor: '#72767e',
    paddingLeft: 12,
    paddingVertical: 4,
    gap: 4,
  },
})
