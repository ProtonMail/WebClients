import { constructDriveFolderUrl } from './open-drive-folder'

describe('constructDriveFolderUrl', () => {
  it('should return folder path when both parentLinkId and shareId are provided', () => {
    const url = constructDriveFolderUrl('parent-link-123', 'share-456', false)
    expect(url).toBe('/share-456/folder/parent-link-123')
  })

  it('should return root path when parentLinkId is undefined', () => {
    const url = constructDriveFolderUrl(undefined, 'share-456', false)
    expect(url).toBe('/')
  })

  it('should return root path when shareId is undefined', () => {
    const url = constructDriveFolderUrl('parent-link-123', undefined, false)
    expect(url).toBe('/')
  })

  it('should return root path when both parentLinkId and shareId are undefined', () => {
    const url = constructDriveFolderUrl(undefined, undefined, false)
    expect(url).toBe('/')
  })

  it('should default isSharedWithMe to false', () => {
    const url = constructDriveFolderUrl('parent-link-123', 'share-456')
    expect(url).toBe('/share-456/folder/parent-link-123')
  })

  it('should go to specific folder even when isSharedWithMe is true', () => {
    const url = constructDriveFolderUrl('parent-link-123', 'share-456', true)
    expect(url).toBe('/share-456/folder/parent-link-123')
  })

  it('should handle empty strings as undefined', () => {
    const url1 = constructDriveFolderUrl('', 'share-456', false)
    expect(url1).toBe('/')

    const url2 = constructDriveFolderUrl('parent-link-123', '', false)
    expect(url2).toBe('/')
  })
})
