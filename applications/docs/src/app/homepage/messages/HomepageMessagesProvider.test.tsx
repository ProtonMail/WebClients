import { render, screen } from '@testing-library/react'
import { CircleLoader } from '../components/CircleLoader'
import { defaultHomepageMessages } from './defaultHomepageMessages'
import { HomepageMessagesProvider } from './HomepageMessagesProvider'

it('shows the host messages', () => {
  const messages = {
    ...defaultHomepageMessages,
    loading: { ...defaultHomepageMessages.loading, loading: 'Chargement' },
  }

  render(
    <HomepageMessagesProvider messages={messages}>
      <CircleLoader />
    </HomepageMessagesProvider>,
  )

  expect(screen.getByText('Chargement')).toBeInTheDocument()
})

it('shows the English defaults without a host provider', () => {
  render(<CircleLoader />)

  expect(screen.getByText('Loading')).toBeInTheDocument()
})
