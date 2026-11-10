import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

import type { BootstrapFailure } from '../__utils/classifyBootstrapError'
import { BootstrapErrorPage } from './BootstrapErrorPage'

jest.mock('./DocumentShell', () => ({
  DocumentShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
jest.mock('./ErrorHeader', () => ({ ErrorHeader: () => null }))
jest.mock('@proton/components/hooks/useAuthentication', () => () => ({ getLocalID: () => 1, UID: 'uid' }))
jest.mock('@proton/account/user/hooks', () => ({ useUser: () => [{ Name: 'user', Email: 'user@example.com' }] }))

const buttons = () => screen.getAllByRole('button').map((button) => button.textContent)

describe('BootstrapErrorPage', () => {
  test.each<[BootstrapFailure, string, string, string[]]>([
    [
      'noAccess',
      "You don't have access",
      'Try a different account or contact the owner for access.',
      ['Switch accounts', 'Open Proton Drive'],
    ],
    ['notFound', 'Something went wrong', 'This document does not exist, or it was deleted.', ['Open Proton Drive']],
    [
      'unreachable',
      'Offline',
      'This document may not exist, or we are having issues loading it.',
      ['Reload', 'Open Proton Drive'],
    ],
    [
      'bootstrapFailed',
      'Something went wrong',
      'This document may not exist, or we are having issues loading it.',
      ['Reload', 'Open Proton Drive'],
    ],
  ])('%s shows /doc\'s card titled "%s"', (failure, title, message, expectedButtons) => {
    render(<BootstrapErrorPage failure={failure} onRetry={jest.fn()} />)

    expect(screen.getByTestId('document-load-error')).toHaveTextContent(title)
    expect(screen.getByText(message, { exact: false })).toBeInTheDocument()
    expect(buttons()).toEqual(expectedButtons)
  })

  test('no access shows who the user is signed in as, as /doc does', () => {
    render(<BootstrapErrorPage failure="noAccess" onRetry={jest.fn()} />)

    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  test.each<BootstrapFailure>(['unreachable', 'bootstrapFailed'])(
    'Reload after %s opens the document again',
    async (failure) => {
      const onRetry = jest.fn()
      render(<BootstrapErrorPage failure={failure} onRetry={onRetry} />)

      await userEvent.click(screen.getByRole('button', { name: 'Reload' }))

      expect(onRetry).toHaveBeenCalledTimes(1)
    },
  )
})
