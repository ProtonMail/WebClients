import type { UserState } from '@lexical/yjs'
import { DocParticipantTracker } from './DocParticipantTracker'
import type { DocumentState } from '../State/DocumentState'

describe('DocParticipantTracker', () => {
  let tracker: DocParticipantTracker
  let mockSharedState: jest.Mocked<DocumentState>

  beforeEach(() => {
    mockSharedState = {
      getProperty: jest.fn(),
      setProperty: jest.fn(),
    } as unknown as jest.Mocked<DocumentState>

    tracker = new DocParticipantTracker(mockSharedState)
  })

  describe('updateParticipantsFromUserStates', () => {
    it('should update shared state if the limit is reached', () => {
      mockSharedState.getProperty.mockReturnValue(false)
      const states = new Array(10).fill({}) as UserState[]

      tracker.updateParticipantsFromUserStates(states)

      expect(mockSharedState.setProperty).toHaveBeenCalledWith('realtimeIsParticipantLimitReached', true)
    })

    it('should update shared state if the limit is unbreached', () => {
      mockSharedState.getProperty.mockReturnValue(true)
      const states = new Array(9).fill({}) as UserState[]

      tracker.updateParticipantsFromUserStates(states)

      expect(mockSharedState.setProperty).toHaveBeenCalledWith('realtimeIsParticipantLimitReached', false)
    })

    it('should not update shared state if the limit status has not changed', () => {
      mockSharedState.getProperty.mockReturnValue(true)
      const states = new Array(10).fill({}) as UserState[]

      tracker.updateParticipantsFromUserStates(states)

      expect(mockSharedState.setProperty).not.toHaveBeenCalled()
    })
  })
})
