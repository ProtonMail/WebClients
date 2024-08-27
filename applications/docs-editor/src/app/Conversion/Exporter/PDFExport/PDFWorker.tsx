import type { PageProps } from '@react-pdf/renderer'
import { Document, Page, View, Text, pdf, Link, Image, Svg, Path } from '@react-pdf/renderer'
import { expose } from 'comlink'
import type { PDFDataNode } from './PDFDataNode'
import { ExportStyles } from './ExportStyles'
import { PerformChineseWrappingFix } from './ChineseWrappingFix'
import { LoadCustomFonts } from './FontLoader'

const Node = ({ node }: { node: PDFDataNode }) => {
  if (!node) {
    return null
  }

  const children =
    typeof node.children === 'string'
      ? node.children
      : node.children?.map((child, index) => {
          return <Node node={child} key={index} />
        })

  switch (node.type) {
    case 'View':
      return <View {...node}>{children}</View>
    case 'Text':
      return <Text {...node}>{children}</Text>
    case 'Link':
      return <Link {...node}>{children}</Link>
    case 'Image':
      return <Image {...node} />
    case 'Svg':
      return <Svg {...node}>{children}</Svg>
    case 'Path': {
      const { children: _, ...props } = node
      return <Path {...props} />
    }
  }
}

const PDFDocument = ({ nodes, pageSize }: { nodes: PDFDataNode[]; pageSize: PageProps['size'] }) => {
  return (
    <Document>
      <Page size={pageSize} style={ExportStyles.page}>
        {nodes.map((node, index) => {
          return <Node node={node} key={index} />
        })}
      </Page>
    </Document>
  )
}

const renderPDF = async (nodes: PDFDataNode[], pageSize: PageProps['size']): Promise<Blob> => {
  PerformChineseWrappingFix()
  LoadCustomFonts(nodes)

  const doc = pdf(<PDFDocument pageSize={pageSize} nodes={nodes} />)
  const blob = await doc.toBlob()
  return blob
}

expose({
  renderPDF,
})

export type PDFWorker = {
  renderPDF: typeof renderPDF
}
