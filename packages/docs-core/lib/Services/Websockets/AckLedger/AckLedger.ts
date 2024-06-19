import { LoggerInterface } from '@proton/utils/logs'
import { ClientMessageWithDocumentUpdates, DocumentUpdate, ServerMessageWithMessageAcks } from '@proton/docs-proto'
import { AckLedgerInterface } from './AckLedgerInterface'

const MAX_TIME_TO_WAIT_FOR_ACK = 10_000

const HOW_OFTEN_TO_CHECK_FOR_UNACKED_MESSAGES = 1_000

type UnconfirmedLedgerEntry = {
  message: DocumentUpdate
  postedAt: Date
}

/**
 * Track which updates have received acknowledgement from the server.
 */
export class AckLedger implements AckLedgerInterface {
  readonly unconfirmedMessages: Map<string, UnconfirmedLedgerEntry> = new Map()
  concerningMessages: Set<string> = new Set()
  erroredMessages: Set<string> = new Set()
  private avgTimeToReceiveAck = 0.0
  private checkerTimer: NodeJS.Timeout | undefined

  constructor(
    private logger: LoggerInterface,
    private readonly statusChangeCallback: () => void,
  ) {
    this.beginCheckingForUnackedMessages()
  }

  destroy(): void {
    clearInterval(this.checkerTimer)
  }

  hasConcerningMessages(): boolean {
    return this.concerningMessages.size > 0
  }

  hasErroredMessages(): boolean {
    return this.erroredMessages.size > 0
  }

  getUnacknowledgedUpdates(): DocumentUpdate[] {
    return Array.from(this.unconfirmedMessages.values()).map((entry) => entry.message)
  }

  beginCheckingForUnackedMessages(): void {
    this.checkerTimer = setInterval(() => {
      this.checkForUnackedMessages()
    }, HOW_OFTEN_TO_CHECK_FOR_UNACKED_MESSAGES)
  }

  checkForUnackedMessages(): void {
    const now = new Date()
    const concerningMessages: UnconfirmedLedgerEntry[] = []
    const erroredMessages: UnconfirmedLedgerEntry[] = []

    const entries = this.unconfirmedMessages.values()

    for (const entry of entries) {
      const timeSincePosted = now.getTime() - entry.postedAt.getTime()
      if (timeSincePosted > this.thresholdForError()) {
        erroredMessages.push(entry)
      } else if (timeSincePosted > this.thresholdForConcern()) {
        concerningMessages.push(entry)
      }
    }

    if (concerningMessages.length > 0 || erroredMessages.length > 0) {
      this.notifyOfUnackedMessages(concerningMessages, erroredMessages)
    }
  }

  notifyOfUnackedMessages(
    concerningMessages: UnconfirmedLedgerEntry[],
    erroredMessages: UnconfirmedLedgerEntry[],
  ): void {
    const newlyConcerningMessages = concerningMessages.filter(
      (entry) => !this.concerningMessages.has(entry.message.uuid),
    )
    const newlyErroredMessages = erroredMessages.filter((entry) => !this.erroredMessages.has(entry.message.uuid))

    if (newlyConcerningMessages.length > 0 || newlyErroredMessages.length > 0) {
      this.concerningMessages = new Set([
        ...this.concerningMessages,
        ...newlyConcerningMessages.map((entry) => entry.message.uuid),
      ])
      this.erroredMessages = new Set([
        ...this.erroredMessages,
        ...newlyErroredMessages.map((entry) => entry.message.uuid),
      ])

      this.notifyOfStatusChange()
    }
  }

  notifyOfStatusChange(): void {
    this.statusChangeCallback()
  }

  thresholdForConcern(): number {
    return this.avgTimeToReceiveAck + 2_500
  }

  thresholdForError(): number {
    return MAX_TIME_TO_WAIT_FOR_ACK
  }

  messagePosted(message: ClientMessageWithDocumentUpdates): void {
    for (const update of message.updates.documentUpdates) {
      this.unconfirmedMessages.set(update.uuid, {
        message: update,
        postedAt: new Date(),
      })
    }
  }

  messageAcknowledgementReceived(message: ServerMessageWithMessageAcks): void {
    this.logger.info(
      'Received ack message',
      message.acks.map((ack) => ack.uuid),
    )

    for (const ack of message.acks) {
      const update = this.unconfirmedMessages.get(ack.uuid)

      if (update) {
        const timeToReceiveAck = new Date().getTime() - update.postedAt.getTime()
        this.avgTimeToReceiveAck = (this.avgTimeToReceiveAck + timeToReceiveAck) / 2

        this.unconfirmedMessages.delete(ack.uuid)

        if (this.concerningMessages.has(ack.uuid) || this.erroredMessages.has(ack.uuid)) {
          this.concerningMessages.delete(ack.uuid)
          this.erroredMessages.delete(ack.uuid)
          this.notifyOfStatusChange()
        }

        this.logger.info(
          `Received ack for message ${ack.uuid} in ${timeToReceiveAck}ms avg time to ack: ${this.avgTimeToReceiveAck}ms`,
        )
      }
    }
  }
}
