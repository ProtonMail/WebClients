import { LoggerInterface } from '@proton/utils/logs'
import { AckLedger } from './AckLedger'
import { ClientMessageWithDocumentUpdates, ServerMessageWithMessageAcks } from '@proton/docs-proto'
import metrics from '@proton/metrics'

const mockMetric = jest.mocked(metrics.docs_document_updates_ack_error_total.increment)

describe('AckLedger', () => {
  let ledger: AckLedger

  const createService = (callback: () => void) =>
    new AckLedger(
      {
        info: jest.fn(),
      } as unknown as LoggerInterface,
      callback,
    )

  beforeEach(() => {
    ledger = createService(() => {})
  })

  afterEach(() => {
    ledger.destroy()
    mockMetric.mockClear()
  })

  describe('messagePosted', () => {
    it('should add to unconfirmed messages', () => {
      const message = {
        updates: {
          documentUpdates: [{ uuid: '1' }, { uuid: '2' }],
        },
      } as ClientMessageWithDocumentUpdates

      ledger.messagePosted(message)

      expect(ledger.unconfirmedMessages.size).toBe(2)
    })
  })

  describe('getUnacknowledgedUpdates', () => {
    it('should return unconfirmed messages', () => {
      const message = {
        updates: {
          documentUpdates: [{ uuid: '1' }, { uuid: '2' }],
        },
      } as ClientMessageWithDocumentUpdates

      ledger.messagePosted(message)

      expect(ledger.getUnacknowledgedUpdates().length).toBe(2)
    })
  })

  describe('messageAcknowledgementReceived', () => {
    it('should remove from unconfirmed messages', () => {
      const message = {
        updates: {
          documentUpdates: [{ uuid: '1' }, { uuid: '2' }],
        },
      } as ClientMessageWithDocumentUpdates

      ledger.messagePosted(message)

      const ackMessage = {
        acks: [{ uuid: '1' }],
      } as ServerMessageWithMessageAcks
      ledger.messageAcknowledgementReceived(ackMessage)

      expect(ledger.unconfirmedMessages.size).toBe(1)
    })

    it('should remove from concerning messages', () => {
      const message = {
        updates: {
          documentUpdates: [{ uuid: '1' }, { uuid: '2' }],
        },
      } as ClientMessageWithDocumentUpdates

      ledger.messagePosted(message)
      ledger.concerningMessages.add('1')

      const ackMessage = {
        acks: [{ uuid: '1' }],
      } as ServerMessageWithMessageAcks
      ledger.messageAcknowledgementReceived(ackMessage)

      expect(ledger.concerningMessages.size).toBe(0)
    })

    it('should remove from errored messages', () => {
      const message = {
        updates: {
          documentUpdates: [{ uuid: '1' }, { uuid: '2' }],
        },
      } as ClientMessageWithDocumentUpdates

      ledger.messagePosted(message)
      ledger.erroredMessages.add('1')

      const ackMessage = {
        acks: [{ uuid: '1' }],
      } as ServerMessageWithMessageAcks
      ledger.messageAcknowledgementReceived(ackMessage)

      expect(ledger.erroredMessages.size).toBe(0)
    })
  })

  describe('checkForUnackedMessages', () => {
    it('should add to concerning messages if concern threshold is passed', () => {
      jest.useFakeTimers()

      const message = {
        updates: {
          documentUpdates: [{ uuid: '1' }],
        },
      } as ClientMessageWithDocumentUpdates

      ledger.messagePosted(message)

      ledger.thresholdForConcern = () => 10

      jest.advanceTimersByTime(11)

      ledger.checkForUnackedMessages()

      expect(ledger.concerningMessages.size).toBe(1)
      expect(mockMetric).toHaveBeenCalledTimes(1)
      expect(mockMetric).toHaveBeenCalledWith(
        {
          type: 'concern_threshold',
        },
        1,
      )
    })

    it('should add to erorred messages if error threshold is passed', () => {
      jest.useFakeTimers()

      const message = {
        updates: {
          documentUpdates: [{ uuid: '1' }],
        },
      } as ClientMessageWithDocumentUpdates

      ledger.messagePosted(message)

      ledger.thresholdForError = () => 10

      jest.advanceTimersByTime(11)

      ledger.checkForUnackedMessages()

      expect(ledger.erroredMessages.size).toBe(1)
      expect(ledger.concerningMessages.size).toBe(0)
      expect(mockMetric).toHaveBeenCalledTimes(1)
      expect(mockMetric).toHaveBeenCalledWith(
        {
          type: 'error_threshold',
        },
        1,
      )
    })

    it('should notify of status change if messages are added', () => {
      jest.useFakeTimers()

      const mock = (ledger.notifyOfStatusChange = jest.fn())

      const message = {
        updates: {
          documentUpdates: [{ uuid: '1' }],
        },
      } as ClientMessageWithDocumentUpdates

      ledger.messagePosted(message)

      ledger.thresholdForConcern = () => 10

      jest.advanceTimersByTime(11)

      ledger.checkForUnackedMessages()

      expect(mock).toHaveBeenCalled()
    })
  })
})
