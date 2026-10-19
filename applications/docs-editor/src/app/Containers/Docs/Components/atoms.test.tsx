import { render, screen } from '@testing-library/react'
import { Avatar } from './atoms'

// Hues of the accent colours getAccentColorForUsername gives these names, from its own test.
const fooHue = 21
const bazHue = 165

it('shows the capitalized initial on the accent colour of the name', () => {
  render(<Avatar name="foo" aria-label="foo" />)

  const avatar = screen.getByLabelText('foo')
  expect(avatar).toHaveTextContent('f')
  expect(avatar).toHaveClass('capitalize')
  expect(avatar).toHaveStyle({
    backgroundColor: `hsl(${fooHue}, 100%, 90%)`,
    color: `hsl(${fooHue}, 100%, 10%)`,
  })
})

it('prefers the awareness colour over the one derived from the name', () => {
  render(<Avatar name="foo" color="hsl(300, 100%, 19%)" aria-label="foo" />)

  expect(screen.getByLabelText('foo')).toHaveStyle({
    backgroundColor: 'hsl(300, 100%, 90%)',
    color: 'hsl(300, 100%, 10%)',
  })
})

it.each([
  ['unusable', 'not a colour'],
  // Proton's UserAvatar drops a hue of 0, so the anonymous lambda colour keeps its name's colour.
  ['a hue of 0', 'hsla(0, 100%, 20%, 1)'],
])('falls back to the name when the awareness colour is %s', (_case, color) => {
  render(<Avatar name="baz" color={color} aria-label="baz" />)

  expect(screen.getByLabelText('baz')).toHaveStyle({ backgroundColor: `hsl(${bazHue}, 100%, 90%)` })
})

it('is neutral and shows its children when there is no name', () => {
  render(
    <Avatar aria-label="Unknown author">
      <svg aria-hidden="true" />
    </Avatar>,
  )

  const avatar = screen.getByLabelText('Unknown author')
  expect(avatar).toHaveClass('bg-[--background-strong]')
  expect(avatar).not.toHaveStyle({ backgroundColor: 'hsl(0, 100%, 90%)' })
  expect(avatar.querySelector('svg')).toBeInTheDocument()
})
