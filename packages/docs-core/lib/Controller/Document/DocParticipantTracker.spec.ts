import { InternalEventBusInterface } from '@proton/docs-shared'
import { UserState } from '@lexical/yjs'
import { DocParticipantTracker, ParticipantTrackerEvent } from './DocParticipantTracker'

describe('DocParticipantTracker', () => {
  let tracker: DocParticipantTracker

  beforeEach(() => {
    tracker = new DocParticipantTracker({
      publish: jest.fn(),
    } as unknown as InternalEventBusInterface)
  })

  describe('updateParticipantsFromUserStates', () => {
    it('should update the totalParticipants and publish an event if the limit is reached', () => {
      const states = new Array(10).fill({}) as UserState[]

      tracker.updateParticipantsFromUserStates(states)

      expect(tracker.isParticipantLimitReached()).toBe(true)
      expect(tracker.eventBus.publish).toHaveBeenCalledWith({
        type: ParticipantTrackerEvent.DocumentLimitBreached,
        payload: undefined,
      })
    })

    it('should update the totalParticipants and publish an event if the limit is unbreached', () => {
      tracker.updateParticipantsFromUserStates(new Array(10).fill({}) as UserState[])

      tracker.eventBus.publish = jest.fn()

      tracker.updateParticipantsFromUserStates(new Array(9).fill({}) as UserState[])

      expect(tracker.isParticipantLimitReached()).toBe(false)
      expect(tracker.eventBus.publish).toHaveBeenCalledWith({
        type: ParticipantTrackerEvent.DocumentLimitUnbreached,
        payload: undefined,
      })
    })
  })
})
