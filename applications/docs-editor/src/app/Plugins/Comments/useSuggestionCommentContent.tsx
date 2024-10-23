import { type CommentInterface, type CommentThreadInterface } from '@proton/docs-shared'
import type { LexicalEditor } from 'lexical'
import { useState, useEffect, Fragment } from 'react'
import debounce from '@proton/utils/debounce'
import { useMarkNodesContext } from '../MarkNodesContext'
import { type SuggestionSummaryContent, generateSuggestionSummary } from '../Suggestions/generateSuggestionSummary'
import { useCommentsContext } from './CommentsContext'
import SpeechBubblePenIcon from '../../Icons/SpeechBubblePenIcon'
import { c } from 'ttag'

const icon = <SpeechBubblePenIcon className="inline h-4 w-4 align-middle" />

/**
 * This hook creates the UI nodes from a summary generated from the editor.
 * If a summary could not be generated from the editor, which happens if the
 * suggestion is accepted or rejected, then it will try to parse and display existing content.
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

  return suggestionContent?.map(({ type, content, replaceWith }, index) => {
    let title = ''
    let color: 'success' | 'weak' = 'success'
    if (type === 'insert') {
      title = c('Label').t`Insert`
    } else if (type === 'delete') {
      title = c('Label').t`Delete`
      color = 'weak'
    } else if (type === 'replace') {
      title = c('Label').t`Replace`
    } else if (type === 'property-change' || type === 'style-change') {
      title = c('Label').t`Format`
    } else if (type === 'split') {
      title = c('Label').t`Insert paragraph`
    } else if (type === 'join') {
      title = c('Label').t`Delete paragraph`
      color = 'weak'
    } else if (type === 'add-link') {
      title = c('Label').t`Add link`
    } else if (type === 'link-change') {
      title = c('Label').t`Replace link`
    } else if (type === 'delete-link') {
      title = c('Label').t`Delete link`
      color = 'weak'
    } else if (type === 'insert-image') {
      title = c('Label').t`Insert image`
    } else if (type === 'delete-image') {
      title = c('Label').t`Delete image`
      color = 'weak'
    } else if (type === 'image-change') {
      title = c('Label').t`Change image size`
    } else if (type === 'indent-change') {
      title = c('Label').t`Change indent level`
    } else if (type === 'insert-table') {
      title = c('Label').t`Insert table`
    } else if (type === 'insert-table-row') {
      title = c('Label').t`Insert table row`
    } else if (type === 'duplicate-table-row') {
      title = c('Label').t`Duplicate table row`
    } else if (type === 'insert-table-column') {
      title = c('Label').t`Insert table column`
    } else if (type === 'duplicate-table-column') {
      title = c('Label').t`Duplicate table column`
    } else if (type === 'delete-table') {
      title = c('Label').t`Delete table`
      color = 'weak'
    } else if (type === 'delete-table-row') {
      title = c('Label').t`Delete table row`
      color = 'weak'
    } else if (type === 'delete-table-column') {
      title = c('Label').t`Delete table column`
      color = 'weak'
    } else if (type === 'block-type-change') {
      title = c('Label').t`Format`
    }
    if (!!replaceWith || type === 'delete' || type === 'insert') {
      content = `"${content}"`
    }
    if (type === 'style-change') {
      content = content
        .split(',')
        .map((property) => {
          switch (property) {
            case 'background-color':
              return c('Info').t`Highlight`
            case 'color':
              return c('Info').t`Text color`
            case 'font-size':
              return c('Info').t`Font size`
            case 'font-family':
              return c('Info').t`Font`
          }
        })
        .join(', ')
    }
    return (
      <Fragment key={index}>
        <div className="line-clamp-2">
          <span className={`color-${color} font-medium`}>
            {icon} {title}
            {content.length > 0 && ':'}
          </span>{' '}
          {content} {replaceWith && <>{c('Label').t`with "${replaceWith}"`}</>}
        </div>
      </Fragment>
    )
  })
}
