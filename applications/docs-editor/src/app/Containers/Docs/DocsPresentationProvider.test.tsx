import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createTableNodeWithDimensions, TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { act, render } from '@testing-library/react'
import type { LexicalEditor, NodeKey } from 'lexical'
import { $getNodeByKey, $getRoot } from 'lexical'
import { DocsPresentationProvider } from './DocsPresentationProvider'
import { EditorUserMode } from './contract/EditorUserMode'
import TableCellResizerPlugin from './Plugins/TableCellResizer'

describe('Docs presentation mode', () => {
  it('updates table resizing when the controlled mode changes without a host state provider', async () => {
    let editor: LexicalEditor
    let cellKey: NodeKey
    function CaptureEditor() {
      ;[editor] = useLexicalComposerContext()
      return null
    }
    const initialConfig = {
      namespace: 'presentation-test',
      nodes: [TableNode, TableRowNode, TableCellNode],
      onError: (error: Error) => {
        throw error
      },
      editorState: () => {
        const table = $createTableNodeWithDimensions(1, 1)
        cellKey = table.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>().getKey()
        $getRoot().append(table)
      },
    }
    function TestEditor({ userMode }: { userMode: EditorUserMode }) {
      return (
        <DocsPresentationProvider userMode={userMode}>
          <LexicalComposer initialConfig={initialConfig}>
            <CaptureEditor />
            <TableCellResizerPlugin />
          </LexicalComposer>
        </DocsPresentationProvider>
      )
    }
    const { rerender } = render(<TestEditor userMode={EditorUserMode.Edit} />)
    const getWidth = () => editor.getEditorState().read(() => $getNodeByKey<TableCellNode>(cellKey)!.getWidth())
    const clearWidth = async () => {
      await act(async () => {
        editor.update(() => $getNodeByKey<TableCellNode>(cellKey)!.setWidth(undefined), { discrete: true })
      })
    }
    await clearWidth()
    expect(getWidth()).toBe(75)

    rerender(<TestEditor userMode={EditorUserMode.Suggest} />)
    await clearWidth()
    expect(getWidth()).toBeUndefined()

    rerender(<TestEditor userMode={EditorUserMode.Edit} />)
    await clearWidth()
    expect(getWidth()).toBe(75)
  })
})
