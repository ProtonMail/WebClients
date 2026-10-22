import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { reportTrashError } from '@proton/docs-core/DriveSDK/trash'
import { restoreDocuments, trashDocuments } from './trashMany'
import { trashManyAndNotify } from './trash-restore-notify'

jest.mock('@proton/docs-core/DriveSDK/trash', () => ({
  reportTrashError: jest.fn(),
  trashDocument: jest.fn(),
  restoreDocument: jest.fn(),
}))

jest.mock('./trashMany', () => ({ trashDocuments: jest.fn(), restoreDocuments: jest.fn() }))

const createNotification = jest.fn()
const onRestored = jest.fn()

async function clickUndo(callIndex = 0) {
  render(<>{createNotification.mock.calls[callIndex][0].text}</>)
  await userEvent.click(screen.getByTestId('notification:undo-button'))
}

// reportTrashError is passed to forEach, so calls have extra args: compare only the error
const reportedErrors = () => jest.mocked(reportTrashError).mock.calls.map(([error]) => error)

describe('trashManyAndNotify', () => {
  const e1 = new Error('e1')
  const e2 = new Error('e2')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows one success toast with Undo when all items are trashed', async () => {
    const batch = { succeeded: ['a', 'b'], failed: [] }
    jest.mocked(trashDocuments).mockResolvedValue(batch)

    const result = await trashManyAndNotify(createNotification, ['a', 'b'], onRestored)

    expect(createNotification).toHaveBeenCalledTimes(1)
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    render(<>{createNotification.mock.calls[0][0].text}</>)
    expect(screen.getByText('2 items moved to trash')).toBeInTheDocument()
    expect(reportTrashError).not.toHaveBeenCalled()
    expect(result).toEqual(batch)
  })

  it('shows success and error toasts on partial failure and reports each distinct error once', async () => {
    jest.mocked(trashDocuments).mockResolvedValue({
      succeeded: ['a'],
      failed: [
        { uid: 'b', error: e1 },
        { uid: 'c', error: e1 },
        { uid: 'd', error: e2 },
      ],
    })

    await trashManyAndNotify(createNotification, ['a', 'b', 'c', 'd'], onRestored)

    expect(createNotification).toHaveBeenCalledTimes(2)
    expect(createNotification.mock.calls[0][0].type).toBe('success')
    render(<>{createNotification.mock.calls[0][0].text}</>)
    expect(screen.getByText('1 item moved to trash')).toBeInTheDocument()
    expect(createNotification).toHaveBeenLastCalledWith({ type: 'error', text: '3 items could not be moved to trash' })
    expect(reportedErrors()).toEqual([e1, e2])
  })

  it('shows only an error toast when nothing was trashed', async () => {
    jest.mocked(trashDocuments).mockResolvedValue({ succeeded: [], failed: [{ uid: 'a', error: e1 }] })

    await trashManyAndNotify(createNotification, ['a'], onRestored)

    expect(createNotification).toHaveBeenCalledTimes(1)
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })

  it('undo restores only the trashed uids and calls onRestored', async () => {
    jest.mocked(trashDocuments).mockResolvedValue({ succeeded: ['a', 'b'], failed: [{ uid: 'c', error: e1 }] })
    jest.mocked(restoreDocuments).mockResolvedValue({ succeeded: ['a', 'b'], failed: [] })
    await trashManyAndNotify(createNotification, ['a', 'b', 'c'], onRestored)

    await clickUndo()

    expect(restoreDocuments).toHaveBeenCalledWith(['a', 'b'])
    expect(createNotification).toHaveBeenLastCalledWith({ type: 'success', text: '2 items restored from trash' })
    expect(onRestored).toHaveBeenCalledTimes(1)
  })

  it('undo with failures shows one restore error and reports the other errors', async () => {
    jest.mocked(trashDocuments).mockResolvedValue({ succeeded: ['a', 'b', 'c'], failed: [] })
    jest.mocked(restoreDocuments).mockResolvedValue({
      succeeded: [],
      failed: [
        { uid: 'a', error: new Error('x Insufficient permissions') },
        { uid: 'b', error: new Error('y Insufficient permissions') },
        { uid: 'c', error: e2 },
      ],
    })
    await trashManyAndNotify(createNotification, ['a', 'b', 'c'], onRestored)

    await clickUndo()

    // the success toast with Undo, then exactly one error toast
    expect(createNotification).toHaveBeenCalledTimes(2)
    expect(createNotification).toHaveBeenLastCalledWith({
      type: 'error',
      text: 'Because this document was in a shared folder, only the folder owner can restore it',
    })
    expect(onRestored).not.toHaveBeenCalled()
    expect(reportedErrors()).toEqual([e2])
  })
})
