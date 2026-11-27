import { render } from '@testing-library/react'

import type { CreateNotificationOptions } from '@proton/app-context/notifications/interfaces'
import { DocsApiError, DocsApiErrorCode } from '@proton-docs/realtime-sdk'

import { commentFailureMessage, commentTextOf, isThreadGone, notifyCommentChangeFailure } from './commentChangeFailures'

const text = (value: string) => ({ type: 'text', text: value, format: 0 })
const paragraph = (...children: object[]) => ({ type: 'paragraph', children })
const state = (...children: object[]) => JSON.stringify({ root: { type: 'root', children } })

describe('commentTextOf', () => {
  test("is the comment composer's text, a line per paragraph, its formatted runs and links joined", () => {
    const content = state(
      paragraph(text('Meet '), { type: 'link', url: 'https://proton.me', children: [text('here')] }),
      paragraph(),
      paragraph(text('Tomorrow')),
    )

    expect(commentTextOf(content)).toBe('Meet here\n\nTomorrow')
  })

  test('keeps a line break made with Shift+Enter', () => {
    const content = state(paragraph(text('First line'), { type: 'linebreak', version: 1 }, text('second line')))

    expect(commentTextOf(content)).toBe('First line\nsecond line')
  })

  test.each(['Plain text from an old comment', '{"not": "a state"}', '[1, 2]'])(
    'is the content itself when it is no editor state: %s',
    (content) => {
      expect(commentTextOf(content)).toBe(content)
    },
  )
})

describe('isThreadGone', () => {
  test.each<[unknown, boolean]>([
    [new DocsApiError('addComment', 404), true],
    [new DocsApiError('resolveThread', 422, DocsApiErrorCode.NotExists), true],
    [new DocsApiError('addComment', 422, DocsApiErrorCode.InsufficientPermissions), false],
    [new DocsApiError('addComment', 500), false],
    [new DocsApiError('addComment'), false],
    [new Error('404'), false],
  ])('%s: %s', (error, gone) => {
    expect(isThreadGone(error)).toBe(gone)
  })
})

describe('commentFailureMessage', () => {
  test('says the thread was deleted, and gives back what was written', () => {
    expect(commentFailureMessage({ call: 'createComment', threadDeleted: true, text: 'See you\nthere' })).toBe(
      "Your reply wasn't saved: the comment thread was deleted.\n\nWhat you wrote:\nSee you\nthere",
    )
  })

  test('without a deleted thread, says only what failed', () => {
    expect(commentFailureMessage({ call: 'acceptSuggestion', threadDeleted: false })).toBe(
      "The suggestion wasn't accepted.",
    )
  })

  test('a new thread names no thread that could be deleted', () => {
    expect(commentFailureMessage({ call: 'createSuggestionThread', threadDeleted: true })).toBe(
      "Your suggestion wasn't saved, so no one can accept or reject it.",
    )
  })
})

describe('notifyCommentChangeFailure', () => {
  /** What the notification shows, as the user reads it */
  function shown(options: CreateNotificationOptions) {
    const { container } = render(<>{options.text}</>)
    return { text: container.textContent, preWrap: container.querySelector('.text-pre-wrap') !== null }
  }

  test('an error notification, kept until closed when it holds what the user wrote', () => {
    const createNotification = vi.fn()

    notifyCommentChangeFailure(createNotification, { call: 'editComment', threadDeleted: false, text: 'Edited' })
    notifyCommentChangeFailure(createNotification, { call: 'rejectSuggestion', threadDeleted: false })

    const [[edit], [reject]] = createNotification.mock.calls
    expect(edit).toMatchObject({ type: 'error', expiration: -1, showCloseButton: true })
    expect(shown(edit)).toEqual({
      text: "Your edit to a comment wasn't saved.\n\nWhat you wrote:\nEdited",
      preWrap: true,
    })
    expect(reject).not.toHaveProperty('expiration')
    expect(shown(reject)).toEqual({ text: "The suggestion wasn't rejected.", preWrap: true })
  })

  test('shows what the user wrote as they wrote it, even when it reads as HTML', () => {
    const createNotification = vi.fn()
    const text = 'a & <b>b</b> <div>c</div> <img src=x>'

    notifyCommentChangeFailure(createNotification, { call: 'createComment', threadDeleted: false, text })

    expect(shown(createNotification.mock.calls[0][0]).text).toBe(`Your reply wasn't saved.\n\nWhat you wrote:\n${text}`)
  })

  test.each(['deleteComment', 'deleteThread'] as const)(
    'nothing for a %s refused because what it deletes is gone',
    (call) => {
      const createNotification = vi.fn()

      notifyCommentChangeFailure(createNotification, { call, threadDeleted: true })

      expect(createNotification).not.toHaveBeenCalled()
    },
  )
})
