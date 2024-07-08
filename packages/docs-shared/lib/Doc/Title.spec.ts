import { SupportedProtonDocsMimeTypes } from '@proton/shared/lib/drive/constants'
import { getNodeNameWithoutExtension } from './Title'
import { DecryptedNode } from '@proton/drive-store/lib'

const mockDecryptedNode = (name: string, mimeType: any) => ({ name, mimeType }) as DecryptedNode

describe('getNodeNameWithoutExtension', () => {
  it('should return the node name without the .md extension', () => {
    const node = mockDecryptedNode('document.md', SupportedProtonDocsMimeTypes.md)
    expect(getNodeNameWithoutExtension(node)).toBe('document')
  })

  it('should return the node name without the .docx extension', () => {
    const node = mockDecryptedNode('document.docx', SupportedProtonDocsMimeTypes.docx)
    expect(getNodeNameWithoutExtension(node)).toBe('document')
  })

  it('should return the node name without the .html extension', () => {
    const node = mockDecryptedNode('document.html', SupportedProtonDocsMimeTypes.html)
    expect(getNodeNameWithoutExtension(node)).toBe('document')
  })

  it('should return the node name without the .txt extension by default', () => {
    const node = mockDecryptedNode('document.txt', 'unknown/mimetype')
    expect(getNodeNameWithoutExtension(node)).toBe('document')
  })

  it('should return the node name as is if it does not have the expected extension', () => {
    const node = mockDecryptedNode('document', SupportedProtonDocsMimeTypes.md)
    expect(getNodeNameWithoutExtension(node)).toBe('document')
  })

  it('should handle edge case with no extension correctly', () => {
    const node = mockDecryptedNode('document', 'unknown/mimetype')
    expect(getNodeNameWithoutExtension(node)).toBe('document')
  })

  it('should handle different extensions correctly', () => {
    const node = mockDecryptedNode('document.other', SupportedProtonDocsMimeTypes.md)
    expect(getNodeNameWithoutExtension(node)).toBe('document.other')
  })
})
