import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { JsonValue, Participant } from '@proton-docs/realtime-sdk'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'

import { DocumentActiveUsers } from './DocumentActiveUsers'

function userState(name: string, userId: string | undefined, extra: Record<string, JsonValue> = {}): JsonValue {
  return {
    name,
    color: 'hsl(120, 50%, 50%)',
    focusing: true,
    anchorPos: null,
    focusPos: null,
    awarenessData: userId === undefined ? null : { userId },
    ...extra,
  }
}

function participant(id: number, state: JsonValue, isSelf = false): Participant {
  return { id, isSelf, state, lastSeenAt: 0 }
}

const logger = { warn: jest.fn() }
const application = { logger } as unknown as ApplicationProviderProps['application']

function renderActiveUsers(participants: Participant[]) {
  const editorInvoker = { syncEvent: jest.fn(async () => {}) }
  render(
    <ApplicationProvider application={application}>
      <DocumentActiveUsers participants={participants} editorInvoker={editorInvoker} />
    </ApplicationProvider>,
  )
  return { editorInvoker }
}

const scrollTo = (state: JsonValue) => ({ name: 'ScrollToUserCursorData', payload: { state } })

const avatars = () => screen.queryAllByTestId('user-avatar').map((avatar) => avatar.textContent)

describe('DocumentActiveUsers', () => {
  test('shows nothing while the user is alone', () => {
    renderActiveUsers([participant(1, userState('alice', 'user-a'), true)])

    expect(screen.queryByTestId('active-users')).not.toBeInTheDocument()
  })

  test('shows one avatar per user, the user first, folding their other tabs into it', () => {
    renderActiveUsers([
      participant(2, userState('bob', 'user-b')),
      participant(3, userState('alice (other tab)', 'user-a')),
      participant(1, userState('alice', 'user-a'), true),
      participant(4, userState('bob (other tab)', 'user-b')),
    ])

    expect(avatars()).toEqual(['a', 'b'])
  })

  test('dedupes users without a user id by name, and skips participants without a user state', () => {
    renderActiveUsers([
      participant(1, userState('alice', 'user-a'), true),
      participant(2, userState('carol', undefined)),
      participant(3, userState('carol', undefined)),
      participant(4, {}),
      participant(5, 'not a user state'),
      participant(6, userState('dave', undefined, { name: 42 })),
    ])

    expect(avatars()).toEqual(['a', 'c', '?'])
  })

  test('shows five avatars and the rest in a +N dropdown', async () => {
    const names = ['alice', 'bob', 'carol', 'dave', 'erin', 'frank', 'grace']
    renderActiveUsers(names.map((name, index) => participant(index, userState(name, `user-${name}`), index === 0)))

    expect(avatars()).toEqual(['a', 'b', 'c', 'd', 'e'])
    await userEvent.click(screen.getByRole('button', { name: '+2 users' }))

    expect(screen.getByRole('button', { name: /frank/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /grace/ })).toBeInTheDocument()
  })

  test("clicking an avatar, or a user in the dropdown, scrolls to that user's cursor with their state", async () => {
    const names = ['alice', 'bob', 'carol', 'dave', 'erin', 'frank']
    const participants = names.map((name, index) => participant(index, userState(name, `user-${name}`), index === 0))
    const { editorInvoker } = renderActiveUsers(participants)

    await userEvent.click(within(screen.getByTestId('active-users')).getAllByTestId('user-avatar')[1])
    expect(editorInvoker.syncEvent).toHaveBeenLastCalledWith(scrollTo(participants[1].state))

    await userEvent.click(screen.getByRole('button', { name: '+1 users' }))
    await userEvent.click(screen.getByRole('button', { name: /frank/ }))
    expect(editorInvoker.syncEvent).toHaveBeenLastCalledWith(scrollTo(participants[5].state))
  })

  test('a failed scroll is logged', async () => {
    const { editorInvoker } = renderActiveUsers([
      participant(1, userState('alice', 'user-a'), true),
      participant(2, userState('bob', 'user-b')),
    ])
    const error = new Error('Editor did not answer syncEvent')
    editorInvoker.syncEvent.mockRejectedValueOnce(error)

    await userEvent.click(screen.getAllByTestId('user-avatar')[1])

    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), error)
  })
})
