import { dirname } from 'path'

it('resolves @ariakit/react-components to the copy @ariakit/react uses', () => {
  // A second copy has its own contexts: menus and popovers inside "More" would close it on press.
  const ariakitReactDirectory = dirname(require.resolve('@ariakit/react/package.json'))
  expect(require.resolve('@ariakit/react-components/package.json')).toBe(
    require.resolve('@ariakit/react-components/package.json', { paths: [ariakitReactDirectory] }),
  )
})
