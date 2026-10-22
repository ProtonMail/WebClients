import { act, render, screen, fireEvent } from '@testing-library/react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { createEditor } from 'lexical'
import ImageComponent from './ImageComponent'

const mockOpenLink = jest.fn()
jest.mock('../../DocsDependenciesProvider', () => ({
  useDocsDependencies: () => ({ openLink: mockOpenLink }),
  useDocsMessages: () => jest.requireActual('../../messages/defaultDocsMessages').defaultDocsMessages,
}))
jest.mock('../../Utils/getEditorWidthWithoutPadding', () => ({
  getElementDimensionsWithoutPadding: () => ({ width: 100, height: 100 }),
}))

function renderImage(src: string) {
  return render(
    <LexicalComposer
      initialConfig={{
        namespace: 'test',
        onError: (error) => {
          throw error
        },
      }}
    >
      <ImageComponent
        src={src}
        altText="Remote image"
        nodeKey="test-image"
        width="inherit"
        height="inherit"
        maxWidth={null}
        showCaption={false}
        caption={createEditor()}
        captionsEnabled={false}
        resizable={false}
      />
    </LexicalComposer>,
  )
}

describe('blocked image recovery', () => {
  it('offers the source through the external-link flow without loading an image', () => {
    const src = 'https://example.com/image.png?download=1'
    const { container } = renderImage(src)
    expect(screen.getByText('Remote image blocked')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: src })
    expect(link).toHaveAttribute('href', src)
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText(/use "Insert image"/)).toBeInTheDocument()
    fireEvent.click(link)
    expect(mockOpenLink).toHaveBeenCalledTimes(1)
    expect(mockOpenLink).toHaveBeenCalledWith(src)
  })

  it.each(['javascript:alert(1)', 'data:text/html,test', 'file:///image.png', 'invalid', ''])(
    'does not offer unsafe or invalid source %s as a link',
    (src) => {
      const { container } = renderImage(src)
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(container.querySelector('img')).toBeNull()
    },
  )
})

describe('embedded image loading', () => {
  it('shows loading feedback and fits the loaded image to the editor width', async () => {
    const preloadedImages: HTMLImageElement[] = []
    const imageConstructor = jest.spyOn(window, 'Image').mockImplementation(() => {
      const image = document.createElement('img')
      preloadedImages.push(image)
      return image
    })
    const naturalWidth = jest.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(200)

    try {
      renderImage('data:image/png;base64,aGVsbG8=')
      expect(screen.getByText('Loading')).toBeInTheDocument()
      expect(preloadedImages).toHaveLength(1)

      act(() => {
        preloadedImages[0].dispatchEvent(new Event('load'))
      })

      const image = await screen.findByRole('img', { name: 'Remote image' })
      expect(image).toHaveStyle({ width: '100px' })
      expect(screen.queryByText('Loading')).not.toBeInTheDocument()
    } finally {
      imageConstructor.mockRestore()
      naturalWidth.mockRestore()
    }
  })
})
