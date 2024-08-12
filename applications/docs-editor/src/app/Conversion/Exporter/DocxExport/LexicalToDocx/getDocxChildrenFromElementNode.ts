import type { ElementNode } from 'lexical'
import { $isTextNode } from 'lexical'
import type { ImageRun, TextRun } from 'docx'
import { ExternalHyperlink } from 'docx'
import { $isLinkNode } from '@lexical/link'
import { getTextRun } from './getTextRun'
import { $isImageNode } from '../../../../Plugins/Image/ImageNode'
import { getImageRun } from './getImageRun'
import type { DocxExportContext } from './Context'

type DocxChildren = (ImageRun | TextRun | ExternalHyperlink)[]

export async function getDocxChildrenFromElementNode(
  node: ElementNode,
  context: DocxExportContext,
): Promise<DocxChildren> {
  const children: DocxChildren = []

  const nodeChildren = context.state.read(() => node.getChildren())

  for (const child of nodeChildren) {
    if ($isImageNode(child)) {
      const imageRun = await getImageRun(child, context.fetchExternalImageAsBase64)
      if (imageRun) {
        children.push(imageRun)
      }
      continue
    }

    if ($isTextNode(child)) {
      children.push(getTextRun(child, node, context.state))
      continue
    }

    if ($isLinkNode(child)) {
      const linkNodeChildren = await getDocxChildrenFromElementNode(child, context)
      children.push(
        new ExternalHyperlink({
          children: linkNodeChildren,
          link: context.state.read(() => child.getURL()),
        }),
      )
      continue
    }
  }

  return children
}
