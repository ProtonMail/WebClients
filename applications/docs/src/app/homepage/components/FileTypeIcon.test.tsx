import { render } from '@testing-library/react'
import { FileTypeIcon } from './FileTypeIcon'

describe('FileTypeIcon', () => {
  it('gives each icon its own gradient, so two icons on a page do not share one', () => {
    const { container } = render(
      <>
        <FileTypeIcon type="document" />
        <FileTypeIcon type="spreadsheet" />
      </>,
    )

    const gradientIds = [...container.querySelectorAll('radialGradient')].map((gradient) => gradient.id)
    expect(new Set(gradientIds).size).toBe(2)
    container.querySelectorAll('svg').forEach((svg, index) => {
      expect(svg.querySelector('path')?.getAttribute('fill')).toBe(`url(#${gradientIds[index]})`)
    })
  })
})
