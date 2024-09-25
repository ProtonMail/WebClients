import type { CommentInterface, CommentThreadInterface, InternalEventBusInterface } from '@proton/docs-shared'
import { CommentThreadState } from '@proton/docs-shared'
import { LocalCommentsState } from './LocalCommentsState'

describe('LocalCommentsState', () => {
  let state: LocalCommentsState
  let eventBus: InternalEventBusInterface

  beforeEach(() => {
    eventBus = {
      publish: jest.fn(),
    } as unknown as InternalEventBusInterface
    state = new LocalCommentsState(eventBus)
  })

  describe('addThread', () => {
    it('should add a thread', () => {
      state.addThread({ id: '1' } as CommentThreadInterface)

      expect(state.getAllThreads()).toEqual([{ id: '1' }])
    })

    it('should mark a thread as unread', () => {
      state.addThread({ id: '1' } as CommentThreadInterface, true)

      expect(state.hasUnreadThreads()).toBe(true)
    })

    it('should prevent duplicates', () => {
      state.addThread({ id: '1' } as CommentThreadInterface)
      state.addThread({ id: '1' } as CommentThreadInterface)

      expect(state.getAllThreads()).toEqual([{ id: '1' }])
    })
  })

  describe('deleteThread', () => {
    it('should delete a thread', () => {
      state.addThread({ id: '1' } as CommentThreadInterface)
      state.deleteThread('1')

      expect(state.getAllThreads()).toEqual([])
    })

    it('should remove thread from unread list', () => {
      state.addThread({ id: '1' } as CommentThreadInterface, true)
      state.deleteThread('1')

      expect(state.hasUnreadThreads()).toBe(false)
    })
  })

  describe('resolveThread', () => {
    it('should resolve a thread', () => {
      state.addThread({ id: '1', state: CommentThreadState.Active } as CommentThreadInterface)
      state.resolveThread('1')

      expect(state.findThreadById('1')?.state).toBe(CommentThreadState.Resolved)
    })
  })

  describe('unresolveThread', () => {
    it('should unresolve a thread', () => {
      state.addThread({ id: '1', state: CommentThreadState.Resolved } as CommentThreadInterface)
      state.unresolveThread('1')

      expect(state.findThreadById('1')?.state).toBe(CommentThreadState.Active)
    })
  })

  describe('changeThreadState', () => {
    it('should change the state of a thread', () => {
      state.addThread({ id: '1', state: CommentThreadState.Active } as CommentThreadInterface)
      state.changeThreadState('1', CommentThreadState.Resolved)

      expect(state.findThreadById('1')?.state).toBe(CommentThreadState.Resolved)
    })
  })

  describe('addComment', () => {
    it('should add a comment to a thread', () => {
      state.addThread({ id: '1', comments: [] as CommentInterface[] } as CommentThreadInterface)
      state.addComment({ id: '1', content: 'test' } as CommentInterface, '1')

      expect(state.findThreadById('1')?.comments).toEqual([{ id: '1', content: 'test' }])
    })

    it('should mark thread as unread when adding a comment', () => {
      state.addThread({ id: '1', comments: [] as CommentInterface[] } as CommentThreadInterface)
      state.addComment({ id: '1', content: 'test' } as CommentInterface, '1', true)

      expect(state.hasUnreadThreads()).toBe(true)
    })
  })

  describe('editComment', () => {
    it('should edit a comment in a thread', () => {
      state.addThread({ id: '1', comments: [{ id: '1', content: 'test' }] } as CommentThreadInterface)
      state.editComment({ commentID: '1', threadID: '1', content: 'edited' })

      expect(state.findThreadById('1')?.comments).toEqual([{ id: '1', content: 'edited' }])
    })

    it('should mark thread as unread when editing a comment', () => {
      state.addThread({ id: '1', comments: [{ id: '1', content: 'test' }] } as CommentThreadInterface)
      state.editComment({ commentID: '1', threadID: '1', content: 'edited', markThreadUnread: true })

      expect(state.hasUnreadThreads()).toBe(true)
    })
  })

  describe('deleteComment', () => {
    it('should delete a comment from a thread', () => {
      state.addThread({ id: '1', comments: [{ id: '1', content: 'test' }] } as CommentThreadInterface)
      state.deleteComment({ commentID: '1', threadID: '1' })

      expect(state.findThreadById('1')?.comments).toEqual([])
    })
  })

  describe('replacePlaceholderThread', () => {
    it('should replace a placeholder thread', () => {
      state.addThread({ id: 'placeholder', isPlaceholder: true } as CommentThreadInterface)
      state.replacePlaceholderThread('placeholder', { id: '1', isPlaceholder: false } as CommentThreadInterface)

      expect(state.findThreadById('1')?.isPlaceholder).toBe(false)
    })
  })

  describe('replacePlaceholderComment', () => {
    it('should replace a placeholder comment', () => {
      state.addThread({ id: '1', comments: [{ id: 'placeholder', isPlaceholder: true }] } as CommentThreadInterface)
      state.replacePlaceholderComment('placeholder', { id: '1', isPlaceholder: false } as CommentInterface)

      expect(state.findThreadById('1')?.comments).toEqual([{ id: '1', isPlaceholder: false }])
    })
  })
})
