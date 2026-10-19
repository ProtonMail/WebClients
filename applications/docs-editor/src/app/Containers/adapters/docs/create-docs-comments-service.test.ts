import {
  CommentsEvent,
  CommentThreadState as HostCommentThreadState,
  CommentThreadType as HostCommentThreadType,
  CommentType as HostCommentType,
  DocAwarenessEvent,
  InternalEventBus,
  LiveCommentsEvent,
} from '@proton/docs-shared'
import type { CommentInterface, CommentThreadInterface } from '@proton/docs-shared'
import type { DocsComment, DocsCommentThread, SafeDocsUserState } from '../../Docs/public'
import { CommentThreadStates, CommentThreadTypes, CommentTypes } from '../../Docs/public'
import { createClientInvokerFixture } from './create-client-invoker-fixture'
import { createDocsCommentsService } from './create-docs-comments-service'

const awarenessState: SafeDocsUserState = {
  name: 'Collaborator',
  color: '#ff0000',
  focusing: true,
  anchorPos: null,
  focusPos: null,
  awarenessData: undefined,
}

describe('Docs comments host adapter', () => {
  it('maps host comment and typing events to editor events and removes all subscriptions together', () => {
    const eventBus = new InternalEventBus()
    const service = createDocsCommentsService(createClientInvokerFixture(), eventBus)
    const onEvent = jest.fn()
    const unsubscribe = service.subscribeToEvents(onEvent)
    const publishEvents = () => {
      eventBus.publish({ type: CommentsEvent.CommentsChanged, payload: { hasUnreadThreads: true } })
      eventBus.publish({ type: CommentsEvent.CreateMarkNode, payload: { markID: 'created' } })
      eventBus.publish({ type: CommentsEvent.RemoveMarkNode, payload: { markID: 'removed' } })
      eventBus.publish({ type: CommentsEvent.ResolveMarkNode, payload: { markID: 'resolved' } })
      eventBus.publish({ type: CommentsEvent.UnresolveMarkNode, payload: { markID: 'unresolved' } })
      eventBus.publish({ type: LiveCommentsEvent.TypingStatusChange, payload: { threadId: 'typing-thread' } })
    }
    publishEvents()
    expect(onEvent.mock.calls).toEqual([
      [{ type: 'changed' }],
      [{ type: 'create-mark', markID: 'created' }],
      [{ type: 'remove-mark', markID: 'removed' }],
      [{ type: 'resolve-mark', markID: 'resolved' }],
      [{ type: 'unresolve-mark', markID: 'unresolved' }],
      [{ type: 'typing', threadId: 'typing-thread' }],
    ])
    unsubscribe()
    publishEvents()
    expect(onEvent).toHaveBeenCalledTimes(6)
  })

  it('passes awareness snapshots through unchanged and stops delivering them after cleanup', () => {
    const eventBus = new InternalEventBus()
    const service = createDocsCommentsService(createClientInvokerFixture(), eventBus)
    const onAwareness = jest.fn()
    const unsubscribe = service.subscribeToAwarenessStates(onAwareness)
    const states = [awarenessState]
    eventBus.publish({ type: DocAwarenessEvent.AwarenessStateChange, payload: { states } })
    expect(onAwareness).toHaveBeenCalledWith(states)
    expect(onAwareness.mock.calls[0][0]).toBe(states)
    eventBus.publish({ type: DocAwarenessEvent.AwarenessStateChange, payload: { states: [] } })
    expect(onAwareness).toHaveBeenLastCalledWith([])
    unsubscribe()
    eventBus.publish({ type: DocAwarenessEvent.AwarenessStateChange, payload: { states } })
    expect(onAwareness).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['getAllThreads', []],
    ['createCommentThread', ['comment', 'mark', false]],
    ['createCommentThread', ['comment', undefined, undefined]],
    ['createSuggestionThread', ['suggestion', 'summary', 'insert']],
    ['createComment', ['comment', 'thread']],
    ['editComment', ['thread', 'comment', 'edited content']],
    ['deleteComment', ['thread', 'comment']],
    ['resolveThread', ['thread']],
    ['unresolveThread', ['thread']],
    ['deleteThread', ['thread']],
    ['acceptSuggestion', ['thread', 'accepted summary']],
    ['rejectSuggestion', ['thread', 'rejected summary']],
    ['rejectSuggestion', ['thread', undefined]],
    ['reopenSuggestion', ['thread']],
    ['beganTypingInThread', ['thread']],
    ['stoppedTypingInThread', ['thread']],
    ['markThreadAsRead', ['thread']],
    ['getTypersExcludingSelf', ['thread']],
  ] as const)('forwards %s arguments with the host receiver', async (method, args) => {
    const client = createClientInvokerFixture()
    const spy = jest.spyOn(client, method)
    const service = createDocsCommentsService(client, new InternalEventBus())
    await Reflect.apply(service[method], undefined, args)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(...args)
    expect(spy.mock.contexts[0]).toBe(client)
  })

  it('returns host results without copying them', async () => {
    const client = createClientInvokerFixture()
    const threads: CommentThreadInterface[] = []
    jest.spyOn(client, 'getAllThreads').mockResolvedValue(threads)
    jest.spyOn(client, 'editComment').mockResolvedValue(true)
    const service = createDocsCommentsService(client, new InternalEventBus())
    expect(await service.getAllThreads()).toBe(threads)
    expect(await service.editComment('thread', 'comment', 'content')).toBe(true)
  })

  it('gives the editor the thread and comment states the host sends', () => {
    expect(CommentThreadStates).toEqual({
      Active: HostCommentThreadState.Active,
      Resolved: HostCommentThreadState.Resolved,
      Accepted: HostCommentThreadState.Accepted,
      Rejected: HostCommentThreadState.Rejected,
    })
    expect(CommentThreadTypes).toEqual({
      Comment: HostCommentThreadType.Comment,
      Suggestion: HostCommentThreadType.Suggestion,
    })
    expect(CommentTypes).toEqual({
      Comment: HostCommentType.Comment,
      Suggestion: HostCommentType.Suggestion,
    })
  })

  it('preserves rejected host promises for the editor to handle', async () => {
    const client = createClientInvokerFixture()
    const error = new Error('Comment mutation failed')
    jest.spyOn(client, 'createCommentThread').mockRejectedValue(error)
    jest.spyOn(client, 'getTypersExcludingSelf').mockRejectedValue(error)
    const service = createDocsCommentsService(client, new InternalEventBus())
    await expect(service.createCommentThread('comment')).rejects.toBe(error)
    await expect(service.getTypersExcludingSelf('thread')).rejects.toBe(error)
  })
})

// Compiled by the app typecheck; this function is deliberately not executed.
function typecheckHostCompatibility(
  hostThread: CommentThreadInterface,
  hostComment: CommentInterface,
  hostState: HostCommentThreadState,
  hostThreadType: HostCommentThreadType,
  hostCommentType: HostCommentType,
) {
  const thread: DocsCommentThread = hostThread
  const comment: DocsComment = hostComment
  const state: DocsCommentThread['state'] = hostState
  const threadType: DocsCommentThread['type'] = hostThreadType
  const commentType: DocsComment['type'] = hostCommentType
  // @ts-expect-error The container reads no thread modify time, so the contract does not promise one.
  const threadModifyTime: unknown = thread.modifyTime
  // @ts-expect-error The container reads no comment modify time, so the contract does not promise one.
  const commentModifyTime: unknown = comment.modifyTime
  // @ts-expect-error A host time object keeps only its own properties across the bridge's structured clone.
  const commentMilliseconds: unknown = comment.createTime.milliseconds
  return { state, threadType, commentType, threadModifyTime, commentModifyTime, commentMilliseconds }
}
void typecheckHostCompatibility
