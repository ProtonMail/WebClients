import type { InternalEventBusInterface } from '@proton/docs-shared/Events/InternalEventBusInterface'

import type { EditorOrchestratorInterface } from '../Services/Orchestrator/EditorOrchestratorInterface'
import { EditorToClientRequestHandler } from './EditorToClientRequestHandler'

describe('EditorToClientRequestHandler.openLink', () => {
  const handler = new EditorToClientRequestHandler(
    document.createElement('iframe'),
    {} as EditorOrchestratorInterface,
    {} as InternalEventBusInterface,
  )

  /** The URLs `openLink` follows, by clicking a link in a new tab. */
  function openedUrls(url: string) {
    const opened: string[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.target).toBe('_blank')
      expect(this.rel).toBe('noopener noreferrer')
      opened.push(this.href)
    })
    void handler.openLink(url)
    click.mockRestore()
    return opened
  }

  it.each([
    'https://example.com/a?b=c',
    'http://example.com/',
    'mailto:someone@example.com',
    'tel:+41000000000',
    'sms:+41000000000',
  ])('opens %s', (url) => {
    expect(openedUrls(url)).toEqual([url])
  })

  it.each([
    'javascript:alert(document.domain)',
    ' JavaScript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<h1>Sign in</h1>',
    'blob:https://example.com/id',
    'file:///etc/passwd',
    'ms-msdt:/id PCWDiagnostic',
    'search-ms:query=x',
    'about:blank',
    'example.com',
    '',
  ])("doesn't open %j", (url) => {
    expect(openedUrls(url)).toEqual([])
  })
})
