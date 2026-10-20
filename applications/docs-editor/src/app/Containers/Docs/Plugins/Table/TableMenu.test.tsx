import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { LexicalEditor } from 'lexical'
import { $getRoot } from 'lexical'
import { AllNodes } from '../../AllNodes'
import { ProtonContentEditable } from '../../ContentEditable/ProtonContentEditable'
import { DocsPresentationProvider } from '../../DocsPresentationProvider'
import { EditorUserMode } from '../../contract/EditorUserMode'
import DocumentEditorTheme from '../../theme/Theme'
import { $createTableNodeWithDimensions } from './CreateTableNodeWithDimensions'
import { TableMenu } from './TableMenu'
import { isCellHeaderColumn } from './TableUtils/isCellHeaderColumn'
import { isCellHeaderRow } from './TableUtils/isCellHeaderRow'

let editor: LexicalEditor

function TestPlugin() {
  ;[editor] = useLexicalComposerContext()
  return null
}

async function renderTableMenu() {
  render(
    <DocsPresentationProvider userMode={EditorUserMode.Edit}>
      <LexicalComposer
        initialConfig={{ namespace: 'test', nodes: AllNodes, theme: DocumentEditorTheme, onError: console.error }}
      >
        <RichTextPlugin
          contentEditable={<ProtonContentEditable isSuggestionMode={false} />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <TestPlugin />
        <TableMenu />
      </LexicalComposer>
    </DocsPresentationProvider>,
  )

  await act(async () => {
    editor.update(() => {
      $getRoot().clear().append($createTableNodeWithDimensions(2, 2))
    })
  })
}

/** Selects the end of a cell, both in Lexical and natively, the way the menu detects its table. */
async function selectCell(rowIndex: number, columnIndex: number) {
  await act(async () => {
    editor.update(() => {
      const table = $getRoot().getFirstChildOrThrow<TableNode>()
      const row = table.getChildren<TableRowNode>()[rowIndex]
      row.getChildren<TableCellNode>()[columnIndex].getFirstChildOrThrow().selectEnd()
    })
  })

  const cellElement = editor.getRootElement()?.querySelectorAll('th, td')[rowIndex * 2 + columnIndex]
  const selection = window.getSelection()
  if (!cellElement || !selection) {
    throw new Error('The table was not rendered')
  }
  act(() => selection.setBaseAndExtent(cellElement, 0, cellElement, 0))
}

/** The table menu only shows a table once a selection lands in it. */
async function showTableMenu() {
  await selectCell(1, 1)
  await waitFor(() => expect(screen.getByRole('toolbar', { name: 'Table' })).toBeVisible())
}

function $firstRowCells() {
  return $getRoot().getFirstChildOrThrow<TableNode>().getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
}

function $firstColumnCells() {
  return $getRoot()
    .getFirstChildOrThrow<TableNode>()
    .getChildren<TableRowNode>()
    .map((row) => row.getFirstChildOrThrow<TableCellNode>())
}

beforeEach(renderTableMenu)

it('groups the table controls in a named toolbar, each with its own name', async () => {
  await showTableMenu()

  const toolbar = screen.getByRole('toolbar', { name: 'Table' })
  expect(toolbar).toHaveAttribute('data-testid', 'table-button-group')
  expect(toolbar.className).not.toMatch(/(^|\s)(button-group|shadow-norm)(-|\s|$)/)
  for (const name of ['Fit table to page width', 'Options', 'Table options']) {
    expect(screen.getByRole('button', { name })).toBeVisible()
  }
})

it('moves focus along the toolbar with the arrow keys', async () => {
  await showTableMenu()

  const [fit, options, tableOptions] = ['Fit table to page width', 'Options', 'Table options'].map((name) =>
    screen.getByRole('button', { name }),
  )
  act(() => fit.focus())

  fireEvent.keyDown(fit, { key: 'ArrowRight' })
  await waitFor(() => expect(options).toHaveFocus())
  fireEvent.keyDown(options, { key: 'ArrowRight' })
  await waitFor(() => expect(tableOptions).toHaveFocus())
  fireEvent.keyDown(tableOptions, { key: 'ArrowLeft' })
  await waitFor(() => expect(options).toHaveFocus())
})

it('announces the header row and column as checked, and toggles them', async () => {
  await showTableMenu()

  fireEvent.click(screen.getByRole('button', { name: 'Options' }))
  expect(await screen.findByRole('menuitemcheckbox', { name: 'Header row' })).toBeChecked()
  expect(screen.getByRole('menuitemcheckbox', { name: 'Header column' })).not.toBeChecked()

  fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Header column' }))
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  editor.read(() => expect($firstColumnCells().every(isCellHeaderColumn)).toBe(true))

  fireEvent.click(screen.getByRole('button', { name: 'Options' }))
  expect(await screen.findByRole('menuitemcheckbox', { name: 'Header column' })).toBeChecked()

  fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Header row' }))
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  editor.read(() => expect($firstRowCells().some(isCellHeaderRow)).toBe(false))

  fireEvent.click(screen.getByRole('button', { name: 'Options' }))
  expect(await screen.findByRole('menuitemcheckbox', { name: 'Header row' })).not.toBeChecked()
})
