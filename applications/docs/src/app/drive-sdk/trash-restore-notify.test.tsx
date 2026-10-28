import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { reportTrashError, restoreDocument, trashDocument } from '@proton/docs-core/DriveSDK/trash'
import { restoreDocuments, trashDocuments } from './trashMany'
import { handleRestoreError, restoreAndNotify, trashAndNotify, trashManyAndNotify } from './trash-restore-notify'

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

const permissionError = new Error('Forbidden: Insufficient permissions; UID=a')

describe('handleRestoreError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the shared folder message and does not report a permission error', () => {
    handleRestoreError(createNotification, permissionError)

    expect(createNotification).toHaveBeenCalledWith({
      type: 'error',
      text: 'Because this document was in a shared folder, only the folder owner can restore it',
    })
    expect(reportTrashError).not.toHaveBeenCalled()
  })

  it('shows the generic message and reports any other error', () => {
    const error = new Error('Network error')

    handleRestoreError(createNotification, error)

    expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to restore document' })
    expect(reportTrashError).toHaveBeenCalledWith(error)
  })
})

describe('trashAndNotify', () => {
  const emitRestored = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(trashDocument).mockResolvedValue(undefined)
  })

  it('trashes the document and shows a success toast with Undo', async () => {
    await trashAndNotify(createNotification, 'a', emitRestored)

    expect(trashDocument).toHaveBeenCalledWith('a')
    expect(createNotification).toHaveBeenCalledTimes(1)
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    render(<>{createNotification.mock.calls[0][0].text}</>)
    expect(screen.getByText('Document moved to trash')).toBeInTheDocument()
    expect(screen.getByTestId('notification:undo-button')).toHaveTextContent('Undo')
  })

  it('does not notify when trashing fails', async () => {
    jest.mocked(trashDocument).mockRejectedValue(new Error('e1'))

    await expect(trashAndNotify(createNotification, 'a', emitRestored)).rejects.toThrow('e1')

    expect(createNotification).not.toHaveBeenCalled()
  })

  it('undo restores the document, shows a toast and calls emitRestored', async () => {
    jest.mocked(restoreDocument).mockResolvedValue(undefined)
    await trashAndNotify(createNotification, 'a', emitRestored)

    await clickUndo()

    expect(restoreDocument).toHaveBeenCalledWith('a')
    expect(createNotification).toHaveBeenLastCalledWith({ type: 'success', text: 'Document restored from trash' })
    expect(emitRestored).toHaveBeenCalledTimes(1)
  })

  it('undo that fails runs handleRestoreError and does not call emitRestored', async () => {
    jest.mocked(restoreDocument).mockRejectedValue(permissionError)
    await trashAndNotify(createNotification, 'a', emitRestored)

    await clickUndo()

    expect(createNotification).toHaveBeenLastCalledWith({
      type: 'error',
      text: 'Because this document was in a shared folder, only the folder owner can restore it',
    })
    expect(reportTrashError).not.toHaveBeenCalled()
    expect(emitRestored).not.toHaveBeenCalled()
  })
})

describe('restoreAndNotify', () => {
  const emitTrashed = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(restoreDocument).mockResolvedValue(undefined)
  })

  it('restores the document and shows a success toast with Undo', async () => {
    await restoreAndNotify(createNotification, 'a', emitTrashed)

    expect(restoreDocument).toHaveBeenCalledWith('a')
    expect(createNotification).toHaveBeenCalledTimes(1)
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    render(<>{createNotification.mock.calls[0][0].text}</>)
    expect(screen.getByText('Document restored from trash')).toBeInTheDocument()
    expect(screen.getByTestId('notification:undo-button')).toHaveTextContent('Undo')
  })

  it('does not notify when restoring fails', async () => {
    jest.mocked(restoreDocument).mockRejectedValue(new Error('e1'))

    await expect(restoreAndNotify(createNotification, 'a', emitTrashed)).rejects.toThrow('e1')

    expect(createNotification).not.toHaveBeenCalled()
  })

  it('undo trashes the document, shows a toast and calls emitTrashed', async () => {
    jest.mocked(trashDocument).mockResolvedValue(undefined)
    await restoreAndNotify(createNotification, 'a', emitTrashed)

    await clickUndo()

    expect(trashDocument).toHaveBeenCalledWith('a')
    expect(createNotification).toHaveBeenLastCalledWith({ type: 'success', text: 'Document moved to trash' })
    expect(emitTrashed).toHaveBeenCalledTimes(1)
  })

  it('undo that fails shows an error toast, reports the error and does not call emitTrashed', async () => {
    const error = new Error('e1')
    jest.mocked(trashDocument).mockRejectedValue(error)
    await restoreAndNotify(createNotification, 'a', emitTrashed)

    await clickUndo()

    expect(createNotification).toHaveBeenLastCalledWith({ type: 'error', text: 'Failed to trash document' })
    expect(reportTrashError).toHaveBeenCalledWith(error)
    expect(emitTrashed).not.toHaveBeenCalled()
  })
})

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
