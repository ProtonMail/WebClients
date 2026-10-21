import { EDITOR_BUILD_INFO_TIMEOUT_MS, getReportMeta } from './reportMeta'

const docsBuildInfo = { appVersion: '5.0.2', commit: 'docs-commit' }

describe('getReportMeta', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('includes the client and editor builds', async () => {
    const editorController = {
      getEditorBuildInfo: jest.fn().mockResolvedValue({ appVersion: '5.0.1', commit: 'editor-commit' }),
    }

    await expect(getReportMeta(docsBuildInfo, editorController)).resolves.toEqual({
      docsVersion: '5.0.2',
      docsCommit: 'docs-commit',
      editorVersion: '5.0.1',
      editorCommit: 'editor-commit',
    })
  })

  it('sets the editor fields to null when the editor call fails', async () => {
    const editorController = { getEditorBuildInfo: jest.fn().mockRejectedValue(new Error('not initialized')) }

    await expect(getReportMeta(docsBuildInfo, editorController)).resolves.toEqual({
      docsVersion: '5.0.2',
      docsCommit: 'docs-commit',
      editorVersion: null,
      editorCommit: null,
    })
  })

  it('sets the editor fields to null when the editor never replies', async () => {
    jest.useFakeTimers()
    const editorController = { getEditorBuildInfo: jest.fn().mockReturnValue(new Promise(() => {})) }

    const reportMeta = getReportMeta(docsBuildInfo, editorController)
    jest.advanceTimersByTime(EDITOR_BUILD_INFO_TIMEOUT_MS)

    await expect(reportMeta).resolves.toEqual({
      docsVersion: '5.0.2',
      docsCommit: 'docs-commit',
      editorVersion: null,
      editorCommit: null,
    })
  })

  it('sets empty values to null', async () => {
    const editorController = {
      getEditorBuildInfo: jest.fn().mockResolvedValue({ appVersion: '', commit: 'editor-commit' }),
    }

    await expect(getReportMeta({ appVersion: '5.0.2', commit: '' }, editorController)).resolves.toEqual({
      docsVersion: '5.0.2',
      docsCommit: null,
      editorVersion: null,
      editorCommit: 'editor-commit',
    })
  })
})
