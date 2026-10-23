import { clsx } from 'clsx'
import type { LexicalEditor } from 'lexical'
import type { DocsComment, DocsCommentThread } from '../../contract/DocsCommentThread'
import { useState, useEffect, Fragment } from 'react'
import debounce from 'lodash/debounce'
import { useMarkNodesContext } from '../MarkNodesContext'
import { type SuggestionSummaryContent, generateSuggestionSummary } from '../Suggestions/generateSuggestionSummary'
import { Icon } from '../../Components/Icon'
import * as Icons from '../../Components/icons'
import { useDocsMessages } from '../../DocsDependenciesProvider'

const icon = <Icon data={Icons.speechBubblePen} className="inline h-4 w-4 align-middle" />

/**
 * This hook creates the UI nodes from a summary generated from the editor.
 * If a summary could not be generated from the editor, which happens if the
 * suggestion is accepted or rejected, then it will try to parse and display existing content.
 */
export function useSuggestionCommentContent(
  comment: DocsComment,
  thread: DocsCommentThread,
  suggestionID: string | null,
  editor: LexicalEditor,
) {
  const { markNodeMap } = useMarkNodesContext()
  const messages = useDocsMessages().comments.suggestionSummary
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
      title = messages.insert
    } else if (type === 'delete') {
      title = messages.delete
      color = 'weak'
    } else if (type === 'replace') {
      title = messages.replace
    } else if (type === 'property-change' || type === 'style-change') {
      title = messages.format
    } else if (type === 'split') {
      title = messages.insertParagraph
    } else if (type === 'join') {
      title = messages.deleteParagraph
      color = 'weak'
    } else if (type === 'add-link') {
      title = messages.addLink
    } else if (type === 'link-change') {
      title = messages.replaceLink
    } else if (type === 'delete-link') {
      title = messages.deleteLink
      color = 'weak'
    } else if (type === 'insert-image') {
      title = messages.insertImage
    } else if (type === 'delete-image') {
      title = messages.deleteImage
      color = 'weak'
    } else if (type === 'image-change') {
      title = messages.changeImageSize
    } else if (type === 'indent-change') {
      title = messages.changeIndentLevel
    } else if (type === 'insert-table') {
      title = messages.insertTable
    } else if (type === 'insert-table-row') {
      title = messages.insertTableRow
    } else if (type === 'duplicate-table-row') {
      title = messages.duplicateTableRow
    } else if (type === 'insert-table-column') {
      title = messages.insertTableColumn
    } else if (type === 'duplicate-table-column') {
      title = messages.duplicateTableColumn
    } else if (type === 'delete-table') {
      title = messages.deleteTable
      color = 'weak'
    } else if (type === 'delete-table-row') {
      title = messages.deleteTableRow
      color = 'weak'
    } else if (type === 'delete-table-column') {
      title = messages.deleteTableColumn
      color = 'weak'
    } else if (type === 'block-type-change') {
      title = messages.format
    } else if (type === 'insert-divider') {
      title = messages.insertDivider
    } else if (type === 'delete-divider') {
      title = messages.deleteDivider
      color = 'weak'
    } else if (type === 'clear-formatting') {
      title = messages.clearFormatting
    } else if (type === 'align-change') {
      title = messages.align
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
              return messages.highlight
            case 'color':
              return messages.textColor
            case 'font-size':
              return messages.fontSize
            case 'font-family':
              return messages.font
          }
        })
        .join(', ')
    }
    return (
      <Fragment key={index}>
        <div className="line-clamp-2">
          <span className={clsx('font-medium', color === 'success' ? 'text-[--signal-success]' : 'text-[--text-weak]')}>
            {icon} {title}
            {content.length > 0 && ':'}
          </span>{' '}
          {content} {replaceWith && <>{messages.replaceWith(replaceWith)}</>}
        </div>
      </Fragment>
    )
  })
}
