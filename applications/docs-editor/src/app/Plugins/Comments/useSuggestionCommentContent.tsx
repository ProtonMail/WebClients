import { CommentThreadState, type CommentInterface, type CommentThreadInterface } from '@proton/docs-shared'
import type { LexicalEditor } from 'lexical'
import { useState, useEffect } from 'react'
import debounce from '@proton/utils/debounce'
import { sendErrorMessage } from '../../Utils/errorMessage'
import { useMarkNodesContext } from '../MarkNodesContext'
import { type SuggestionSummaryContent, generateSuggestionSummary } from '../Suggestions/generateSuggestionSummary'
import { useCommentsContext } from './CommentsContext'
import SpeechBubblePenIcon from '../../Icons/SpeechBubblePenIcon'
import { c } from 'ttag'

const icon = <SpeechBubblePenIcon className="inline h-4 w-4 align-middle" />

/**
 * This hook creates the UI nodes from a summary generated from the editor,
 * and updates the comment's "content" if changed. If a summary could not be
 * generated from the editor, which happens if the suggestion is accepted or
 * rejected, then it will try to parse and display existing content.
 */
export function useSuggestionCommentContent(
  comment: CommentInterface,
  thread: CommentThreadInterface,
  suggestionID: string | null,
  editor: LexicalEditor,
) {
  const { controller } = useCommentsContext()
  const { markNodeMap } = useMarkNodesContext()
  const [suggestionContent, setSuggestionContent] = useState<SuggestionSummaryContent | null>(null)

  useEffect(() => {
    if (!suggestionID) {
      return
    }

    const generateAndSetSuggestionContent = () => {
      const content = generateSuggestionSummary(editor, markNodeMap, suggestionID)
      if (content.length === 0) {
        // Try using existing comment content if cannot generate
        try {
          const parsed = JSON.parse(comment.content)
          if (Array.isArray(parsed) && parsed.every((item) => 'type' in item && 'content' in item)) {
            setSuggestionContent(parsed as SuggestionSummaryContent)
          }
        } catch (error) {
          console.error(error)
        }
        return
      }
      setSuggestionContent(content)
      const isPlaceholder = thread.isPlaceholder || comment.isPlaceholder
      if (thread.state !== CommentThreadState.Active || isPlaceholder) {
        return
      }
      const stringifiedContent = JSON.stringify(content)
      if (stringifiedContent !== comment.content) {
        controller.editComment(thread.id, comment.id, stringifiedContent).catch(sendErrorMessage)
      }
    }

    generateAndSetSuggestionContent()

    const debouncedGetContent = debounce(generateAndSetSuggestionContent, 250)

    return editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
      const isEmptyUpdate = dirtyElements.size === 0 && dirtyLeaves.size === 0
      if (isEmptyUpdate) {
        return
      }
      debouncedGetContent()
    })
  }, [
    comment.content,
    comment.id,
    comment.isPlaceholder,
    controller,
    editor,
    markNodeMap,
    suggestionID,
    thread.id,
    thread.isPlaceholder,
    thread.state,
  ])

  return suggestionContent?.map(({ type, content }, index) => {
    let title = ''
    let color: 'success' | 'weak' = 'success'
    if (type === 'insert') {
      title = c('Label').t`Insert`
    } else if (type === 'delete') {
      title = c('Label').t`Delete`
      color = 'weak'
    } else if (type === 'replace') {
      title = c('Label').t`Replace`
    } else if (type === 'property-change') {
      title = c('Label').t`Format`
    } else if (type === 'split') {
      title = c('Label').t`Insert paragraph`
    } else if (type === 'join') {
      title = c('Label').t`Delete paragraph`
      color = 'weak'
    }
    return (
      <div key={index}>
        <span className={`color-${color} font-medium`}>
          {icon} {title}
          {content.length > 0 && ':'}
        </span>{' '}
        {content}
      </div>
    )
  })
}
