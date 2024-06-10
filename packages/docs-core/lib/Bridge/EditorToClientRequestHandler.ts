import {
  BroadcastSources,
  CommentInterface,
  CommentThreadInterface,
  EditorRequiresClientMethods,
  RtsMessagePayload,
} from '@proton/docs-shared'
import { UserState } from '@lexical/yjs'
import { EditorOrchestratorInterface } from '../Services/Orchestrator/EditorOrchestratorInterface'
import { traceError } from '@proton/shared/lib/helpers/sentry'
import { ErrorInfo } from 'react'

/** Handle messages sent by the editor to the client */
export class EditorToClientRequestHandler implements EditorRequiresClientMethods {
  constructor(private readonly docOrchestrator: EditorOrchestratorInterface) {}

  async editorRequestsPropagationOfUpdate(
    message: RtsMessagePayload,
    originator: string,
    debugSource: BroadcastSources,
  ): Promise<void> {
    return this.docOrchestrator.editorRequestsPropagationOfUpdate(message, originator, debugSource)
  }

  async getTypersExcludingSelf(threadId: string): Promise<string[]> {
    return this.docOrchestrator.getTypersExcludingSelf(threadId)
  }

  async createComment(content: string, threadID: string): Promise<CommentInterface | undefined> {
    return this.docOrchestrator.createComment(content, threadID)
  }

  async beganTypingInThread(threadID: string): Promise<void> {
    return this.docOrchestrator.beganTypingInThread(threadID)
  }

  async stoppedTypingInThread(threadID: string): Promise<void> {
    return this.docOrchestrator.stoppedTypingInThread(threadID)
  }

  async unresolveThread(threadId: string): Promise<boolean> {
    return this.docOrchestrator.unresolveThread(threadId)
  }

  async editComment(threadID: string, commentID: string, content: string): Promise<boolean> {
    return this.docOrchestrator.editComment(threadID, commentID, content)
  }

  async deleteComment(threadID: string, commentID: string): Promise<boolean> {
    return this.docOrchestrator.deleteComment(threadID, commentID)
  }

  async getAllThreads(): Promise<CommentThreadInterface[]> {
    return this.docOrchestrator.getAllThreads()
  }

  async createThread(commentContent: string): Promise<CommentThreadInterface | undefined> {
    return this.docOrchestrator.createThread(commentContent)
  }

  async resolveThread(threadId: string): Promise<boolean> {
    return this.docOrchestrator.resolveThread(threadId)
  }

  async deleteThread(id: string): Promise<boolean> {
    return this.docOrchestrator.deleteThread(id)
  }

  async markThreadAsRead(id: string): Promise<void> {
    return this.docOrchestrator.markThreadAsRead(id)
  }

  async handleAwarenessStateUpdate(states: UserState[]): Promise<void> {
    return this.docOrchestrator.handleAwarenessStateUpdate(states)
  }

  async openLink(url: string): Promise<void> {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.click()
    link.remove()
  }

  async reportError(error: Error, errorInfo?: ErrorInfo): Promise<void> {
    traceError(error, {
      tags: {
        'editor-to-client': true,
      },
      extra: {
        errorInfo,
      },
    })
  }
}
