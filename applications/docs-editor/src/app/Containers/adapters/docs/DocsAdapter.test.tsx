import { act, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { CommentsEvent, DocAwarenessEvent, EditorEvent } from '@proton/docs-shared'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact'
import { isDevOrBlack } from '@proton/shared/lib/env'
import { TelemetryDocsEditorEvents } from '@proton/shared/lib/api/telemetry'
import type { SafeDocsUserState } from '../../Docs/public'
import { useDocsDependencies, type DocsDependencies } from '../../Docs/DocsDependenciesProvider'
import { ApplicationProvider } from '../../ApplicationProvider'
import { Application } from '../../../Lib/Application'
import { reportErrorToSentry } from '../../../Utils/errorMessage'
import type { DocsCommentEvent } from '../../Docs/contract/DocsComments'
import { createClientInvokerFixture } from './create-client-invoker-fixture'
import { DocsAdapter } from './DocsAdapter'

const mockCreateNotification = jest.fn()
const mockShowAlert = jest.fn()

jest.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: mockCreateNotification }),
}))
jest.mock('@proton/docs-shared/components/GenericAlert', () => ({
  useGenericAlertModal: () => [<div key="alert" data-testid="host-alert" />, mockShowAlert],
}))
jest.mock('../../../Utils/errorMessage', () => ({ reportErrorToSentry: jest.fn() }))
jest.mock('@proton/shared/lib/env', () => ({
  ...jest.requireActual('@proton/shared/lib/env'),
  isDevOrBlack: jest.fn(() => false),
}))

function setup({
  onCursor,
  onComments,
  onAwareness,
  initialLocale,
}: {
  onCursor?: (state: SafeDocsUserState) => void
  onComments?: (event: DocsCommentEvent) => void
  onAwareness?: (states: SafeDocsUserState[]) => void
  initialLocale?: string
} = {}) {
  const application = new Application()
  if (initialLocale) {
    application.setLocale(initialLocale)
  }
  application.environment = undefined
  application.syncedState.setProperty('userName', 'First user')
  application.syncedState.setProperty('suggestionsEnabled', true)
  const clientInvoker = createClientInvokerFixture()
  let dependencies: DocsDependencies
  function Consumer() {
    dependencies = useDocsDependencies()
    const { subscribeToCollaboratorCursorNavigation, comments } = dependencies
    useEffect(() => {
      if (onCursor) {
        return subscribeToCollaboratorCursorNavigation(onCursor)
      }
    }, [subscribeToCollaboratorCursorNavigation])
    useEffect(() => {
      if (onComments) {
        return comments.subscribeToEvents(onComments)
      }
    }, [comments])
    useEffect(() => {
      if (onAwareness) {
        return comments.subscribeToAwarenessStates(onAwareness)
      }
    }, [comments])
    return null
  }
  function Tree({ app, client = clientInvoker }: { app: Application; client?: EditorRequiresClientMethods }) {
    return (
      <ApplicationProvider application={app}>
        <DocsAdapter clientInvoker={client}>
          <Consumer />
        </DocsAdapter>
      </ApplicationProvider>
    )
  }
  const view = render(<Tree app={application} />)
  return {
    application,
    clientInvoker,
    get dependencies() {
      return dependencies
    },
    rerender: (app = application, client = clientInvoker) => view.rerender(<Tree app={app} client={client} />),
    unmount: view.unmount,
  }
}

const cursorState: SafeDocsUserState = {
  name: 'Collaborator',
  color: '#ff0000',
  focusing: true,
  anchorPos: null,
  focusPos: null,
  awarenessData: undefined,
}

const contact: ContactEmail = {
  ID: 'contact-email',
  Email: 'friend@example.test',
  Name: 'Friend',
  Type: [],
  Defaults: 0,
  Order: 0,
  ContactID: 'contact',
  LabelIDs: [],
  LastUsedTime: 0,
}

describe('DocsAdapter runtime services', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(isDevOrBlack).mockReturnValue(false)
  })
  afterEach(() => jest.restoreAllMocks())

  it('updates reactive session inputs while keeping service callbacks stable', () => {
    const host = setup()
    const initial = host.dependencies
    expect(initial).toMatchObject({ userName: 'First user', suggestionsEnabled: true, isAlpha: false })
    act(() => {
      host.application.syncedState.setProperty('userName', 'Second user')
      host.application.syncedState.setProperty('suggestionsEnabled', false)
    })
    expect(host.dependencies).toMatchObject({ userName: 'Second user', suggestionsEnabled: false })
    expect(host.dependencies.reportError).toBe(initial.reportError)
    expect(host.dependencies.subscribeToCollaboratorCursorNavigation).toBe(
      initial.subscribeToCollaboratorCursorNavigation,
    )
    expect(host.dependencies.reportWordCount).toBe(initial.reportWordCount)
    expect(host.dependencies.showAlert).toBe(initial.showAlert)
    expect(host.dependencies.createInfoNotification).toBe(initial.createInfoNotification)
    expect(host.dependencies.comments).toBe(initial.comments)

    host.application.environment = 'alpha'
    host.rerender()
    expect(host.dependencies.isAlpha).toBe(true)
    host.application.environment = 'beta'
    host.rerender()
    expect(host.dependencies.isAlpha).toBe(false)
    jest.mocked(isDevOrBlack).mockReturnValue(true)
    host.rerender()
    expect(host.dependencies.isAlpha).toBe(true)
  })

  it('updates contact display names and exposes current role and locale metadata', () => {
    const host = setup()
    expect(host.dependencies).toMatchObject({ canEdit: false, canComment: false, languageCode: 'en' })
    expect(host.dependencies.getDisplayNameForEmail(undefined)).toBe('Anonymous User')
    expect(host.dependencies.getDisplayNameForEmail(contact.Email)).toBe(contact.Email)

    act(() => host.application.syncedState.setProperty('contactEmails', [contact]))
    expect(host.dependencies.getDisplayNameForEmail(contact.Email)).toBe('Friend')
    act(() => host.application.syncedState.setProperty('contactEmails', [{ ...contact, Name: 'Updated friend' }]))
    expect(host.dependencies.getDisplayNameForEmail(contact.Email)).toBe('Updated friend')

    host.application.setRole('Commenter')
    act(() => host.application.setLocale('fr_FR'))
    host.rerender()
    expect(host.dependencies).toMatchObject({ canEdit: false, canComment: true, languageCode: 'fr' })
    host.application.setRole('Editor')
    host.rerender()
    expect(host.dependencies).toMatchObject({ canEdit: true, canComment: true })

    const replacement = new Application()
    replacement.syncedState.setProperty('contactEmails', [{ ...contact, Name: 'Replacement friend' }])
    replacement.setRole('Viewer')
    replacement.setLocale('de_DE')
    host.rerender(replacement)
    expect(host.dependencies).toMatchObject({ canEdit: false, canComment: false, languageCode: 'de' })
    expect(host.dependencies.getDisplayNameForEmail(contact.Email)).toBe('Replacement friend')
    act(() => host.application.syncedState.setProperty('contactEmails', [contact]))
    expect(host.dependencies.getDisplayNameForEmail(contact.Email)).toBe('Replacement friend')
  })

  it('updates locale without a parent render and rebinds and cleans up its locale subscription', () => {
    const subscribeToLocale = Application.prototype.subscribeToLocale
    const onCleanup = jest.fn()
    const subscriptions = jest.spyOn(Application.prototype, 'subscribeToLocale').mockImplementation(function (
      this: Application,
      callback,
    ) {
      const unsubscribe = subscribeToLocale.call(this, callback)
      return () => {
        onCleanup(this)
        unsubscribe()
      }
    })
    const host = setup({ initialLocale: 'it_IT' })
    expect(host.dependencies.languageCode).toBe('it')
    const initialServices = host.dependencies
    act(() => host.application.setLocale('fr_FR'))
    expect(host.dependencies.languageCode).toBe('fr')
    expect(host.dependencies.comments).toBe(initialServices.comments)
    expect(host.dependencies.reportWordCount).toBe(initialServices.reportWordCount)
    expect(host.dependencies.subscribeToCollaboratorCursorNavigation).toBe(
      initialServices.subscribeToCollaboratorCursorNavigation,
    )
    expect(subscriptions).toHaveBeenCalledTimes(1)
    const initialCallback = subscriptions.mock.calls[0][0]

    const replacement = new Application()
    replacement.setLocale('de_DE')
    host.rerender(replacement)
    expect(host.dependencies.languageCode).toBe('de')
    expect(subscriptions).toHaveBeenCalledTimes(2)
    expect(subscriptions.mock.contexts).toEqual([host.application, replacement])
    expect(subscriptions.mock.calls[1][0]).toBe(initialCallback)
    expect(onCleanup).toHaveBeenCalledTimes(1)
    expect(onCleanup).toHaveBeenLastCalledWith(host.application)
    act(() => host.application.setLocale('es_ES'))
    expect(host.dependencies.languageCode).toBe('de')
    act(() => replacement.setLocale('nl_NL'))
    expect(host.dependencies.languageCode).toBe('nl')

    host.unmount()
    expect(onCleanup).toHaveBeenCalledTimes(2)
    expect(onCleanup).toHaveBeenLastCalledWith(replacement)
    act(() => replacement.setLocale('pt_PT'))
    expect(host.dependencies.languageCode).toBe('nl')
  })

  it('rebinds comments and awareness subscriptions on dependency replacement and removes them on unmount', () => {
    const onComments = jest.fn()
    const onAwareness = jest.fn()
    const host = setup({ onComments, onAwareness })
    const publish = (application: Application) => {
      act(() => {
        application.eventBus.publish({ type: CommentsEvent.CommentsChanged, payload: { hasUnreadThreads: false } })
        application.eventBus.publish({
          type: DocAwarenessEvent.AwarenessStateChange,
          payload: { states: [cursorState] },
        })
      })
    }

    publish(host.application)
    expect(onComments).toHaveBeenCalledTimes(1)
    expect(onAwareness).toHaveBeenCalledTimes(1)
    const initialComments = host.dependencies.comments
    const replacementClient = createClientInvokerFixture()
    host.rerender(host.application, replacementClient)
    expect(host.dependencies.comments).not.toBe(initialComments)
    publish(host.application)
    expect(onComments).toHaveBeenCalledTimes(2)
    expect(onAwareness).toHaveBeenCalledTimes(2)

    const replacement = new Application()
    host.rerender(replacement, replacementClient)
    publish(host.application)
    expect(onComments).toHaveBeenCalledTimes(2)
    expect(onAwareness).toHaveBeenCalledTimes(2)
    publish(replacement)
    expect(onComments).toHaveBeenLastCalledWith({ type: 'changed' })
    expect(onAwareness).toHaveBeenLastCalledWith([cursorState])
    expect(onComments).toHaveBeenCalledTimes(3)
    expect(onAwareness).toHaveBeenCalledTimes(3)
    host.unmount()
    publish(replacement)
    expect(onComments).toHaveBeenCalledTimes(3)
    expect(onAwareness).toHaveBeenCalledTimes(3)
  })

  it('rebinds cursor subscriptions to a replacement session and cleans up on unmount', () => {
    const onCursor = jest.fn()
    const host = setup({ onCursor })
    act(() =>
      host.application.syncedState.emitEvent({ name: 'ScrollToUserCursorData', payload: { state: cursorState } }),
    )
    expect(onCursor).toHaveBeenLastCalledWith(cursorState)
    const replacement = new Application()
    host.rerender(replacement)
    act(() =>
      host.application.syncedState.emitEvent({ name: 'ScrollToUserCursorData', payload: { state: cursorState } }),
    )
    expect(onCursor).toHaveBeenCalledTimes(1)
    act(() => replacement.syncedState.emitEvent({ name: 'ScrollToUserCursorData', payload: { state: cursorState } }))
    expect(onCursor).toHaveBeenCalledTimes(2)
    host.unmount()
    act(() => replacement.syncedState.emitEvent({ name: 'ScrollToUserCursorData', payload: { state: cursorState } }))
    expect(onCursor).toHaveBeenCalledTimes(2)
  })

  it('forwards notifications, alerts, toolbar interactions, and word counts to the host', () => {
    const host = setup()
    host.clientInvoker.editorReportingEvent = jest.fn(async () => {})
    host.clientInvoker.reportWordCount = jest.fn(async () => {})
    const count = { document: { wordCount: 3, characterCount: 12, nonWhitespaceCharacterCount: 10 } }
    host.dependencies.createWarningNotification('Warning message')
    host.dependencies.createInfoNotification('Info message')
    host.dependencies.showAlert('Alert title', 'Alert message')
    host.dependencies.reportToolbarInteraction()
    host.dependencies.reportWordCount(count)
    expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Warning message', type: 'warning' })
    expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Info message', type: 'info' })
    expect(mockShowAlert).toHaveBeenCalledWith({ title: 'Alert title', translatedMessage: 'Alert message' })
    expect(screen.getByTestId('host-alert')).toBeInTheDocument()
    expect(host.clientInvoker.editorReportingEvent).toHaveBeenCalledWith(EditorEvent.ToolbarClicked, undefined)
    expect(host.clientInvoker.reportWordCount).toHaveBeenCalledWith(count)
  })

  it('reports rejected host effects and forwards explicit error metadata', async () => {
    const host = setup()
    const error = new Error('Host effect failed')
    host.clientInvoker.openLink = jest.fn().mockRejectedValue(error)
    host.clientInvoker.editorReportingEvent = jest.fn().mockRejectedValue(error)
    host.clientInvoker.editorReportingTelemetry = jest.fn().mockRejectedValue(error)
    host.clientInvoker.reportWordCount = jest.fn().mockRejectedValue(error)
    host.dependencies.openLink('https://example.test')
    host.dependencies.reportToolbarInteraction()
    host.dependencies.reportTelemetry(TelemetryDocsEditorEvents.table_of_contents_available)
    host.dependencies.reportWordCount({})
    await waitFor(() => expect(reportErrorToSentry).toHaveBeenCalledTimes(4))
    expect(reportErrorToSentry).toHaveBeenCalledWith(error, undefined, undefined)
    host.dependencies.reportError(error, { source: 'test' })
    expect(reportErrorToSentry).toHaveBeenLastCalledWith(error, undefined, { source: 'test' })
  })
})
