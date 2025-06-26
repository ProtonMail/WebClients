import { mergeRegister } from '@lexical/utils'
import { type Binding, createUndoManager } from '@lexical/yjs'
import type { LexicalCommand, LexicalEditor } from 'lexical'
import {
  UNDO_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  createCommand,
} from 'lexical'
import { useMemo, useCallback, useEffect } from 'react'
import type { UndoManager } from 'yjs'

export const POP_UNDO_STACK_COMMAND: LexicalCommand<void> = createCommand('POP_UNDO_STACK')
export const POP_REDO_STACK_COMMAND: LexicalCommand<void> = createCommand('POP_REDO_STACK')
export const CLEAR_HISTORY_COMMAND: LexicalCommand<void> = createCommand('CLEAR_HISTORY')

export function useYjsHistory(editor: LexicalEditor, binding: Binding): UndoManager {
  const undoManager = useMemo(() => createUndoManager(binding, binding.root.getSharedType()), [binding])

  const clearHistory = useCallback(() => {
    undoManager.clear()
  }, [undoManager])

  const updateUndoRedoStates = useCallback(() => {
    editor.dispatchCommand(CAN_UNDO_COMMAND, undoManager.undoStack.length > 0)
    editor.dispatchCommand(CAN_REDO_COMMAND, undoManager.redoStack.length > 0)
  }, [editor, undoManager.redoStack.length, undoManager.undoStack.length])

  useEffect(() => {
    const undo = () => {
      undoManager.undo()
    }

    const redo = () => {
      undoManager.redo()
    }

    return mergeRegister(
      editor.registerCommand(
        UNDO_COMMAND,
        () => {
          undo()
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        REDO_COMMAND,
        () => {
          redo()
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        POP_UNDO_STACK_COMMAND,
        () => {
          undoManager.undoStack.pop()
          updateUndoRedoStates()
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        POP_REDO_STACK_COMMAND,
        () => {
          undoManager.redoStack.pop()
          updateUndoRedoStates()
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        CLEAR_HISTORY_COMMAND,
        () => {
          clearHistory()
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  })

  // Exposing undo and redo states
  useEffect(() => {
    undoManager.on('stack-item-added', updateUndoRedoStates)
    undoManager.on('stack-item-popped', updateUndoRedoStates)
    undoManager.on('stack-cleared', updateUndoRedoStates)
    return () => {
      undoManager.off('stack-item-added', updateUndoRedoStates)
      undoManager.off('stack-item-popped', updateUndoRedoStates)
      undoManager.off('stack-cleared', updateUndoRedoStates)
    }
  }, [editor, undoManager, updateUndoRedoStates])

  return undoManager
}

/**
 * Does a discrete update to the given editor and pops the undo stack if a
 * stack item was added because of the update to make it non-undoable.
 */
export function nonUndoableUpdate(editor: LexicalEditor, undoManager: UndoManager | null, updateFn: () => void): void {
  if (!undoManager) {
    throw new Error('Tried to call nonUndoableUpdate without an undoManager')
  }
  const stackLengthBeforeUpdate = undoManager.undoStack.length
  editor.update(updateFn, {
    discrete: true,
  })
  const stackLengthAfterUpdate = undoManager.undoStack.length
  if (stackLengthAfterUpdate > stackLengthBeforeUpdate) {
    editor.dispatchCommand(POP_UNDO_STACK_COMMAND, undefined)
  }
}
