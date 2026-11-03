import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportToPDFModal } from './ExportToPDFModal'

/** The modals' shared backdrop, as `BackdropContainer` renders it while a modal is open. */
function addBackdrop() {
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-two-backdrop modal-two-backdrop--in'
  document.body.appendChild(backdrop)
  return backdrop
}

function renderModal() {
  const print = jest.fn()
  const onExit = jest.fn()
  render(<ExportToPDFModal open onClose={print} onExit={onExit} />)
  return { print, onExit }
}

async function clickGotIt() {
  await userEvent.click(screen.getByRole('button', { name: 'Got it', hidden: true }))
}

/** jsdom has no `AnimationEvent`, and `fireEvent.animationEnd` would drop `animationName`. */
function finishModalExitAnimation() {
  const event = new Event('animationend', { bubbles: true })
  Object.defineProperty(event, 'animationName', { value: 'anime-modal-two-out' })
  fireEvent(document.querySelector('.modal-two')!, event)
}

describe('ExportToPDFModal', () => {
  afterEach(() => {
    document.querySelectorAll('.modal-two-backdrop').forEach((backdrop) => backdrop.remove())
    jest.useRealTimers()
  })

  test('does not print while the modal is still closing', async () => {
    const { print } = renderModal()

    await clickGotIt()

    expect(document.querySelector('.modal-two')).toHaveClass('modal-two--out')
    expect(print).not.toHaveBeenCalled()
  })

  test('prints only once the modal has exited and the backdrop is hidden', async () => {
    const backdrop = addBackdrop()
    const { print, onExit } = renderModal()

    await clickGotIt()
    finishModalExitAnimation()

    expect(onExit).toHaveBeenCalledTimes(1)
    expect(print).not.toHaveBeenCalled()

    backdrop.className = 'modal-two-backdrop modal-two-backdrop--out'
    await act(async () => {})
    expect(print).not.toHaveBeenCalled()

    backdrop.className = 'modal-two-backdrop hidden'
    await act(async () => {})
    expect(print).toHaveBeenCalledTimes(1)
  })

  test('prints once the modal has exited when there is no backdrop', async () => {
    const { print } = renderModal()

    await clickGotIt()
    finishModalExitAnimation()
    await act(async () => {})

    expect(print).toHaveBeenCalledTimes(1)
  })

  test('still prints when the backdrop stays, as it does under another open modal', async () => {
    addBackdrop()
    const { print } = renderModal()

    await clickGotIt()
    jest.useFakeTimers()
    finishModalExitAnimation()
    await act(async () => {
      jest.advanceTimersByTime(999)
    })
    expect(print).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(1)
    })
    expect(print).toHaveBeenCalledTimes(1)
  })
})
