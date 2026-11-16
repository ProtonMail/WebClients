import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { LoadingScreenStatus } from '../__utils/loadingScreen'
import { LoadingScreen } from './LoadingScreen'

describe('LoadingScreen', () => {
  test.each<[LoadingScreenStatus, string]>([
    ['opening', 'Opening document…'],
    ['decrypting', 'Decrypting document…'],
    ['syncing', 'Syncing latest changes…'],
    ['preparingEditor', 'Preparing editor…'],
    ['creating', 'Creating new document…'],
    ['redirecting', 'Redirecting…'],
  ])('while %s, says "%s" in a live region, under an indeterminate progress bar', (status, text) => {
    render(<LoadingScreen status={status} />)

    expect(screen.getByRole('status')).toHaveTextContent(text)
    expect(screen.getByRole('progressbar', { name: 'Loading' })).not.toHaveAttribute('aria-valuenow')
    expect(screen.getByText('Proton Docs')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('keeps one live region as the status changes, so each change is announced', () => {
    const { rerender } = render(<LoadingScreen status="opening" />)
    const status = screen.getByRole('status')

    rerender(<LoadingScreen status="decrypting" />)

    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveTextContent('Decrypting document…')
  })

  test("says it can't connect, with no bar, and offers Try again when given a retry", async () => {
    const onRetry = jest.fn()
    render(<LoadingScreen status="cantConnect" onRetry={onRetry} />)

    expect(screen.getByRole('status')).toHaveTextContent("Can't connect")
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('takes no focus', () => {
    render(<LoadingScreen status="cantConnect" onRetry={jest.fn()} />)

    expect(document.body).toHaveFocus()
  })

  // jsdom applies no stylesheet: these classes stop the slide and pulse a partial bar under reduced motion, and
  // `keep-motion` keeps the shared reduce-motion rule from freezing it full width first
  test('marks its bar for the reduced-motion pulse, from the system and from the app setting', () => {
    render(<LoadingScreen status="opening" />)
    const bar = screen.getByRole('progressbar')
    const move = bar.querySelector('.animate-loading-bar-move')
    const stretch = bar.querySelector('.animate-loading-bar-stretch')

    expect(move).toHaveClass('motion-reduce:!animate-none', '[.feature-animations-off_&]:!animate-none')
    expect(stretch).toHaveClass(
      'keep-motion',
      'motion-reduce:!animate-pulse',
      'motion-reduce:scale-x-[0.4]',
      '[.feature-animations-off_&]:!animate-pulse',
      '[.feature-animations-off_&]:scale-x-[0.4]',
    )
  })

  test('sits just under modals', () => {
    render(<LoadingScreen status="opening" />)

    expect(screen.getByTestId('loading-screen')).toHaveClass('fixed', 'inset-0', 'z-[899]')
  })
})
