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

describe('openLink', () => {
  /** The URLs `openLink` follows, by clicking a link in a new tab. */
  async function openedUrls(url: string) {
    const opened: string[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.target).toBe('_blank')
      expect(this.rel).toBe('noopener noreferrer')
      opened.push(this.href)
    })
    try {
      await createClientHandler(dependencies({})).openLink(url)
    } finally {
      click.mockRestore()
    }
    return opened
  }

  test.each([
    'https://example.com/a?b=c',
    'http://example.com/',
    'mailto:someone@example.com',
    'tel:+41000000000',
    'sms:+41000000000',
  ])('opens %s', async (url) => {
    expect(await openedUrls(url)).toEqual([url])
  })

  test.each([
    'javascript:alert(document.domain)',
    ' JavaScript:alert(1)',
    'java\tscript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<h1>Sign in</h1>',
    'blob:https://example.com/id',
    'file:///etc/passwd',
    'smb://example.com/share',
    'ms-msdt:/id PCWDiagnostic',
    'search-ms:query=x',
    'about:blank',
    'example.com',
    '',
  ])("doesn't open %j", async (url) => {
    expect(await openedUrls(url)).toEqual([])
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
