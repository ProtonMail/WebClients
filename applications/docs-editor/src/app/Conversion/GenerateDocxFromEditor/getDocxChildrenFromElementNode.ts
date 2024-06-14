import { $isTextNode, ElementNode } from 'lexical'
import { ExternalHyperlink, TextRun } from 'docx'
import { $isLinkNode } from '@lexical/link'
import { getTextRun } from './getTextRun'

type DocxChildren = (TextRun | ExternalHyperlink)[]
export function getDocxChildrenFromElementNode(node: ElementNode): DocxChildren {
  const children: DocxChildren = []

  for (const child of node.getChildren()) {
    if ($isTextNode(child)) {
      children.push(getTextRun(child, node))
      continue
    }
    if ($isLinkNode(child)) {
      const linkNodeChildren = getDocxChildrenFromElementNode(child)
      children.push(
        new ExternalHyperlink({
          children: linkNodeChildren,
          link: child.getURL(),
        }),
      )
      continue
    }
  }

  return children
}
