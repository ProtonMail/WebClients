import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TreeView } from '@lexical/react/LexicalTreeView'
import './tree-view.scss'

export default function TreeViewPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext()
  return (
    <div className="Lexical__treeView fixed bottom-4 right-4 h-[50vh] w-[40vw] overflow-y-auto rounded bg-[--background-weak] p-2">
      <TreeView
        viewClassName=""
        treeTypeButtonClassName="mb-2"
        timeTravelButtonClassName="ml-2 mb-2"
        timeTravelPanelClassName="absolute flex gap-2 bottom-0 left-0 w-full bg-[--background-weak]"
        timeTravelPanelSliderClassName="flex-grow"
        timeTravelPanelButtonClassName="debug-timetravel-panel-button"
        editor={editor}
      />
    </div>
  )
}
