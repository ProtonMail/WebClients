import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { CircleLoader } from './CircleLoader'

describe('CircleLoader', () => {
  it('Tells screen readers it is loading', () => {
    render(<CircleLoader />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})
