import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Refusal } from '@proton-docs/realtime-sdk'

import { createFakeSession } from '../__utils/createFakeSession'
import { DocumentSizeLimitModal } from './DocumentSizeLimitModal'

const sizeLimitReached: Refusal = { reason: 'documentSizeLimitReached', attemptedBytes: 26, limitBytes: 25 }
const title = 'Document Size Limit Exceeded'

/** Whether the modal is shown and not closing. jsdom plays no animation, so a closed modal stays in the DOM. */
const isShown = () => {
  const modal = document.querySelector('.modal-two')
  return modal !== null && !modal.classList.contains('modal-two--out')
}

const close = () => userEvent.click(screen.getByRole('button', { name: 'Okay', hidden: true }))

describe('DocumentSizeLimitModal', () => {
  test('opens on a size-limit refusal, explains it without removing older revisions, and closes', async () => {
    const fake = createFakeSession()
    render(<DocumentSizeLimitModal session={fake.session} />)
    expect(isShown()).toBe(false)

    act(() => fake.emit('refusal', sizeLimitReached))

    expect(await screen.findByText(title)).toBeInTheDocument()
    expect(isShown()).toBe(true)
    expect(
      screen.getByText(
        'This document has grown too large, and your latest changes couldn’t be saved. Copy any work you need to keep it.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/revisions/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { hidden: true }).map((button) => button.textContent)).toEqual(['Okay'])

    await close()

    expect(isShown()).toBe(false)
  })

  test('opens once per session: a later size-limit refusal does not reopen it', async () => {
    const fake = createFakeSession()
    render(<DocumentSizeLimitModal session={fake.session} />)
    act(() => fake.emit('refusal', sizeLimitReached))
    await screen.findByText(title)
    await close()

    act(() => fake.emit('refusal', sizeLimitReached))

    expect(isShown()).toBe(false)
  })

  test.each<Refusal>([
    { reason: 'updateTooLarge', attemptedBytes: 2, limitBytes: 1 },
    { reason: 'incompleteBaseState' },
  ])('stays closed on a $reason refusal', (refusal) => {
    const fake = createFakeSession()
    render(<DocumentSizeLimitModal session={fake.session} />)

    act(() => fake.emit('refusal', refusal))

    expect(isShown()).toBe(false)
  })

  test('leaves no listener once unmounted, and listens to nothing without a session', () => {
    const fake = createFakeSession()
    const { unmount } = render(<DocumentSizeLimitModal session={fake.session} />)
    expect(fake.listenerCount()).toBe(1)

    unmount()
    render(<DocumentSizeLimitModal session={undefined} />)

    expect(fake.listenerCount()).toBe(0)
  })
})
