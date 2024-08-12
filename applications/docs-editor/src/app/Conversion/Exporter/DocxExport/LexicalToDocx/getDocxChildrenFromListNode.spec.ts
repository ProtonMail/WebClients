import { createHeadlessEditor } from '@lexical/headless'
import { ListNode, ListItemNode } from '@lexical/list'
import { TextNode, $getRoot } from 'lexical'
import { AllNodes } from '../../../../AllNodes'
import { getDocxChildrenFromListNode } from './getDocxChildrenFromListNode'
import type { Paragraph } from 'docx'
import type { DocxExportContext } from './Context'

function jsonify(obj: any) {
  return JSON.parse(JSON.stringify(obj))
}

function getListItemProperties(paragraph: Paragraph) {
  const json = jsonify(paragraph)
  const properties = json.properties.root
  const numberingProperties = properties.find((x: any) => x.rootKey === 'w:numPr').root
  const level = numberingProperties
    .find((x: any) => x.rootKey === 'w:ilvl')
    .root.find((x: any) => x.rootKey === '_attr').root.val
  const numberingId = numberingProperties
    .find((x: any) => x.rootKey === 'w:numId')
    .root.find((x: any) => x.rootKey === '_attr').root.val
  return {
    level,
    numberingId,
  }
}

describe('getDocxChildrenFromListNode', () => {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'export-editor',
    nodes: AllNodes,
    onError: console.error,
  })

  it('should get items from flat list', async () => {
    editor.update(
      () => {
        $getRoot().clear()

        const bulletList = new ListNode('bullet', 1)

        const bulletListItem1 = new ListItemNode()
        bulletListItem1.append(new TextNode('item 1'))

        const listItem2Node = new ListItemNode()
        listItem2Node.append(new TextNode('item 2'))

        bulletList.append(bulletListItem1)
        bulletList.append(listItem2Node)

        $getRoot().append(bulletList)

        const numberedList = new ListNode('number', 1)

        const numberListItem1 = new ListItemNode()
        numberListItem1.append(new TextNode('item 1'))

        const numberListItem2 = new ListItemNode()
        numberListItem2.append(new TextNode('item 2'))

        numberedList.append(numberListItem1)
        numberedList.append(numberListItem2)

        $getRoot().append(numberedList)
      },
      { discrete: true },
    )

    const state = editor.getEditorState()
    const context: DocxExportContext = { state, fetchExternalImageAsBase64: jest.fn() }

    const children = state.read(() => $getRoot().getChildren())
    const bulletList = children[0] as ListNode
    const numberedList = children[1] as ListNode

    const bulletChildren = await getDocxChildrenFromListNode(bulletList, context)

    expect(bulletChildren).toHaveLength(2)
    expect(getListItemProperties(bulletChildren[0]).level).toBe(0)
    expect(getListItemProperties(bulletChildren[0]).numberingId).toBe(1)
    expect(getListItemProperties(bulletChildren[1]).level).toBe(0)
    expect(getListItemProperties(bulletChildren[1]).numberingId).toBe(1)

    const numberedChildren = await getDocxChildrenFromListNode(numberedList, context)

    expect(numberedChildren).toHaveLength(2)
    expect(getListItemProperties(numberedChildren[0]).level).toBe(0)
    expect(getListItemProperties(numberedChildren[0]).numberingId).toBe('{numbering-0}')
    expect(getListItemProperties(numberedChildren[1]).level).toBe(0)
    expect(getListItemProperties(numberedChildren[1]).numberingId).toBe('{numbering-0}')
  })

  it('should get items from nested list, with correct numbering id', async () => {
    editor.update(
      () => {
        $getRoot().clear()

        const bulletList = new ListNode('bullet', 1)

        const bulletListItem1 = new ListItemNode()
        bulletListItem1.append(new TextNode('item 1'))

        const bulletListItem2 = new ListItemNode()
        bulletListItem2.append(new TextNode('item 2'))

        const nestedBulletList = new ListNode('bullet', 1)
        nestedBulletList.append(new ListItemNode().append(new TextNode('nested item 1')))

        bulletList.append(bulletListItem1)
        bulletList.append(nestedBulletList)
        bulletList.append(bulletListItem2)

        $getRoot().append(bulletList)

        const numberedList = new ListNode('number', 1)

        const numberListItem1 = new ListItemNode()
        numberListItem1.append(new TextNode('item 1'))

        const numberListItem2 = new ListItemNode()
        numberListItem2.append(new TextNode('item 2'))

        const nestedNumberedList = new ListNode('number', 1)
        nestedNumberedList.append(new ListItemNode().append(new TextNode('nested item 1')))

        numberedList.append(numberListItem1)
        numberedList.append(nestedNumberedList)
        numberedList.append(numberListItem2)

        $getRoot().append(numberedList)
      },
      { discrete: true },
    )

    const state = editor.getEditorState()
    const context: DocxExportContext = { state, fetchExternalImageAsBase64: jest.fn() }

    const children = state.read(() => $getRoot().getChildren())
    const bulletList = children[0] as ListNode
    const numberedList = children[1] as ListNode

    const bulletChildren = await getDocxChildrenFromListNode(bulletList, context)

    expect(bulletChildren).toHaveLength(3)
    expect(getListItemProperties(bulletChildren[0]).level).toBe(0)
    expect(getListItemProperties(bulletChildren[1]).level).toBe(1)
    expect(getListItemProperties(bulletChildren[2]).level).toBe(0)

    const numberedChildren = await getDocxChildrenFromListNode(numberedList, context)

    expect(numberedChildren).toHaveLength(3)
    expect(getListItemProperties(numberedChildren[0]).level).toBe(0)
    expect(getListItemProperties(numberedChildren[0]).numberingId).toBe('{numbering-0}')
    expect(getListItemProperties(numberedChildren[1]).level).toBe(1)
    expect(getListItemProperties(numberedChildren[1]).numberingId).toBe('{numbering-1}')
    expect(getListItemProperties(numberedChildren[2]).level).toBe(0)
    expect(getListItemProperties(numberedChildren[2]).numberingId).toBe('{numbering-0}')
  })
})
