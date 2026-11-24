import { EditorEvent } from '@proton/docs-shared/Bridge/EditorEvent'

import { type ClientHandlerDependencies, createClientHandler } from './createClientHandler'

describe('createClientHandler', () => {
  test("the editor's toolbar click reaches onToolbarClicked, which a public viewer's page opens the splash on", async () => {
    const onToolbarClicked = vi.fn()
    const handler = createClientHandler(dependencies({ onToolbarClicked }))

    await handler.editorReportingEvent(EditorEvent.ToolbarClicked, undefined)

    expect(onToolbarClicked).toHaveBeenCalledTimes(1)
  })

  test('without onToolbarClicked, a toolbar click does nothing', async () => {
    const handler = createClientHandler(dependencies({}))

    await expect(handler.editorReportingEvent(EditorEvent.ToolbarClicked, undefined)).resolves.toBeUndefined()
  })
})

function dependencies(overrides: Partial<ClientHandlerDependencies>): ClientHandlerDependencies {
  return {
    editorFrame: {} as HTMLIFrameElement,
    sendUpdate: vi.fn(),
    isFlagEnabled: () => false,
    onEditorError: vi.fn(),
    onWordCount: vi.fn(),
    onEditorRendered: vi.fn(),
    showModal: vi.fn(),
    onFileMenuAction: vi.fn(),
    onPresenceUpdate: vi.fn(),
    fetchExternalImageAsBase64: async () => undefined,
    comments: undefined,
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as ClientHandlerDependencies['logger'],
    ...overrides,
  }
}
