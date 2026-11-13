import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { Avatar, Input } from './atoms'

describe('Input', () => {
  it("Keeps Proton's test ids, which E2E tests find the search field by, and forwards its ref to the field", () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} placeholder="Search recents" prefix={<span>icon</span>} />)

    const field = screen.getByRole('textbox')
    expect(screen.getByTestId('input-input-element')).toBe(field)
    expect(ref.current).toBe(field)
    expect(screen.getByTestId('input-root')).toContainElement(screen.getByText('icon'))
  })
})

describe('Avatar', () => {
  it('Is hidden from screen readers, as the name beside it says who it is', () => {
    render(<Avatar>AB</Avatar>)

    expect(screen.getByText('AB')).toHaveAttribute('aria-hidden', 'true')
  })
})
