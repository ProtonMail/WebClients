import {
  CommentThreadStates,
  CommentThreadTypes,
  CommentTypes,
  type DocsCommentEvent,
} from '../app/Containers/Docs/public'
import { createStandaloneDocClient } from './client'

function setup() {
  const client = createStandaloneDocClient('local@example.test', () => () => {})
  const events: DocsCommentEvent[] = []
  client.subscribeToEvents((event) => events.push(event))
  return { client, events }
}

describe('standalone Docs comments', () => {
  it('lists a new comment thread and asks the editor to mark the selection', async () => {
    const { client, events } = setup()

    const thread = await client.createCommentThread('First comment')

    expect(await client.getAllThreads()).toEqual([
      expect.objectContaining({
        id: thread!.id,
        markID: thread!.markID,
        state: CommentThreadStates.Active,
        type: CommentThreadTypes.Comment,
        isPlaceholder: false,
        comments: [
          expect.objectContaining({
            content: 'First comment',
            author: 'local@example.test',
            type: CommentTypes.Comment,
            verificationResult: { verified: true },
          }),
        ],
      }),
    ])
    expect(events).toEqual([{ type: 'changed' }, { type: 'create-mark', markID: thread!.markID }])
  })

  it('adds, edits and deletes replies in a thread', async () => {
    const { client, events } = setup()
    const thread = await client.createCommentThread('First comment')
    events.length = 0

    const reply = await client.createComment('A reply', thread!.id)
    expect(await client.editComment(thread!.id, reply!.id, 'An edited reply')).toBe(true)
    expect((await client.getAllThreads())[0].comments.map((comment) => comment.content)).toEqual([
      'First comment',
      'An edited reply',
    ])

    expect(await client.deleteComment(thread!.id, reply!.id)).toBe(true)
    expect((await client.getAllThreads())[0].comments.map((comment) => comment.content)).toEqual(['First comment'])
    expect(events).toEqual([{ type: 'changed' }, { type: 'changed' }, { type: 'changed' }])
  })

  it('refuses to change a comment in a thread that does not exist', async () => {
    const { client, events } = setup()

    expect(await client.createComment('A reply', 'missing')).toBeUndefined()
    expect(await client.editComment('missing', 'missing', 'Edit')).toBe(false)
    expect(await client.deleteComment('missing', 'missing')).toBe(false)
    expect(events).toEqual([])
  })

  it('resolves and reopens a thread, listing resolved threads last and updating its mark', async () => {
    const { client, events } = setup()
    const first = await client.createCommentThread('First thread')
    const second = await client.createCommentThread('Second thread')
    events.length = 0

    expect(await client.resolveThread(first!.id)).toBe(true)
    expect((await client.getAllThreads()).map((thread) => [thread.id, thread.state])).toEqual([
      [second!.id, CommentThreadStates.Active],
      [first!.id, CommentThreadStates.Resolved],
    ])

    expect(await client.unresolveThread(first!.id)).toBe(true)
    expect((await client.getAllThreads()).map((thread) => [thread.id, thread.state])).toEqual([
      [first!.id, CommentThreadStates.Active],
      [second!.id, CommentThreadStates.Active],
    ])
    expect(events).toEqual([
      { type: 'changed' },
      { type: 'resolve-mark', markID: first!.markID },
      { type: 'changed' },
      { type: 'unresolve-mark', markID: first!.markID },
    ])
  })

  it('deletes a thread, leaving its mark for the editor to remove', async () => {
    const { client, events } = setup()
    const thread = await client.createCommentThread('First comment')
    events.length = 0

    expect(await client.deleteThread(thread!.id)).toBe(true)
    expect(await client.getAllThreads()).toEqual([])
    expect(events).toEqual([{ type: 'changed' }])
    expect(await client.deleteThread(thread!.id)).toBe(false)
  })

  it('creates a suggestion thread on the suggestion, without a comment mark', async () => {
    const { client, events } = setup()

    const thread = await client.createSuggestionThread('suggestion-id', 'Suggestion content', 'insert')

    expect(await client.getAllThreads()).toEqual([
      expect.objectContaining({
        id: thread!.id,
        markID: 'suggestion-id',
        state: CommentThreadStates.Active,
        type: CommentThreadTypes.Suggestion,
        comments: [expect.objectContaining({ content: 'Suggestion content', type: CommentTypes.Suggestion })],
      }),
    ])
    expect(events).toEqual([{ type: 'changed' }])
  })

  it('accepts, reopens and rejects a suggestion, recording each summary on the thread', async () => {
    const { client } = setup()
    const thread = await client.createSuggestionThread('suggestion-id', 'Suggestion content', 'insert')
    const stateAndComments = async () => {
      const [{ state, comments }] = await client.getAllThreads()
      return [state, comments.map((comment) => [comment.content, comment.type])]
    }

    expect(await client.acceptSuggestion(thread!.id, 'Accepted summary')).toBe(true)
    expect(await stateAndComments()).toEqual([
      CommentThreadStates.Accepted,
      [
        ['Suggestion content', CommentTypes.Suggestion],
        ['Accepted summary', CommentTypes.Suggestion],
      ],
    ])

    expect(await client.reopenSuggestion(thread!.id)).toBe(true)
    expect((await stateAndComments())[0]).toBe(CommentThreadStates.Active)

    expect(await client.rejectSuggestion(thread!.id)).toBe(true)
    expect(await stateAndComments()).toEqual([
      CommentThreadStates.Rejected,
      [
        ['Suggestion content', CommentTypes.Suggestion],
        ['Accepted summary', CommentTypes.Suggestion],
      ],
    ])
    expect(await client.acceptSuggestion('missing', 'Summary')).toBe(false)
  })

  it('stops notifying a listener once it unsubscribes', async () => {
    const client = createStandaloneDocClient('local@example.test', () => () => {})
    const listener = jest.fn()
    const unsubscribe = client.subscribeToEvents(listener)

    unsubscribe()
    await client.createCommentThread('First comment')

    expect(listener).not.toHaveBeenCalled()
  })
})
