import type { ReactElement, ReactNode } from 'react';

import { act, fireEvent, render as baseRender, screen, waitFor } from '@testing-library/react';

import { membersReducer } from '@proton/account/members';
import { membersPageReducer } from '@proton/account/members/membersPage';
import { TestStoreProvider } from '@proton/account/testing/TestStoreProvider';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';

import ServiceAccountManagers from './ServiceAccountManagers';

const mockApi = vi.fn();

// The search results live in the members page slice, which fetches through the store's api.
const render = (ui: ReactElement) => {
    const { store } = getTestStore({
        reducer: { ...membersPageReducer, ...membersReducer },
        extraThunkArguments: { api: mockApi } as unknown as ProtonThunkArguments,
    });
    return baseRender(ui, {
        wrapper: ({ children }) => <TestStoreProvider store={store}>{children}</TestStoreProvider>,
    });
};

vi.mock('@proton/components/components/dropdown/Dropdown', () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const members = [
    { ID: 'alice-member', Name: 'Org Alice', Addresses: [{ Email: 'alice@example.test' }] },
    { ID: 'bob-member', Name: 'Org Bob', Addresses: [{ Email: 'bob@example.test' }] },
];
const getProps = () => ({
    selected: [],
    onChange: vi.fn(),
    excludedMemberIDs: [],
    canAssign: true,
    canRemove: true,
    disabled: false,
    existingMemberIDs: [],
});

beforeEach(() => {
    mockApi.mockReset();
    mockApi.mockResolvedValue({ Members: members });
});

it('renders distinct suggestions and selects managers with their real member IDs', async () => {
    const consoleError = vi.spyOn(console, 'error');
    try {
        const props = getProps();
        const { rerender } = render(<ServiceAccountManagers {...props} />);
        fireEvent.change(screen.getByLabelText('Add managers'), { target: { value: 'Org' } });

        const alice = await screen.findByRole('button', { name: 'Org Alice <alice@example.test>' });
        expect(screen.getByRole('button', { name: 'Org Bob <bob@example.test>' })).toBeInTheDocument();
        await waitFor(() =>
            expect(mockApi).toHaveBeenCalledWith(
                expect.objectContaining({ method: 'get', url: 'core/v4/members/search', params: { q: 'Org' } })
            )
        );
        fireEvent.click(alice);
        const selected = [{ MemberID: 'alice-member', Name: 'Org Alice', Email: 'alice@example.test' }];
        expect(props.onChange).toHaveBeenLastCalledWith(selected);

        rerender(<ServiceAccountManagers {...props} selected={selected} />);
        fireEvent.change(screen.getByLabelText('Add managers'), { target: { value: 'Org' } });
        fireEvent.click(await screen.findByRole('button', { name: 'Org Bob <bob@example.test>' }));
        expect(props.onChange).toHaveBeenLastCalledWith([
            ...selected,
            { MemberID: 'bob-member', Name: 'Org Bob', Email: 'bob@example.test' },
        ]);
        expect(consoleError.mock.calls.some(([message]) => /unique.*key|same key/.test(String(message)))).toBe(false);
    } finally {
        consoleError.mockRestore();
    }
});

it('excludes service accounts and members without an address', async () => {
    mockApi.mockResolvedValue({
        Members: [...members, { ID: 'no-address-member', Name: 'Org Without Address', Addresses: [] }],
    });
    render(<ServiceAccountManagers {...getProps()} excludedMemberIDs={['bob-member']} />);
    fireEvent.change(screen.getByLabelText('Add managers'), { target: { value: 'Org' } });
    await screen.findByRole('button', { name: 'Org Alice <alice@example.test>' });
    expect(screen.queryByRole('button', { name: 'Org Bob <bob@example.test>' })).not.toBeInTheDocument();
    expect(screen.queryByText('Org Without Address')).not.toBeInTheDocument();
});

it('keeps the results and stops loading when the same query is retyped within the debounce delay', async () => {
    render(<ServiceAccountManagers {...getProps()} />);
    const input = screen.getByLabelText('Add managers');
    fireEvent.change(input, { target: { value: 'Org' } });
    await screen.findByRole('button', { name: 'Org Alice <alice@example.test>' });
    vi.useFakeTimers();
    try {
        fireEvent.change(input, { target: { value: 'Or' } });
        fireEvent.change(input, { target: { value: 'Org' } });
        act(() => vi.advanceTimersByTime(300));
    } finally {
        vi.useRealTimers();
    }
    expect(screen.getByRole('button', { name: 'Org Alice <alice@example.test>' })).toBeInTheDocument();
    expect(mockApi.mock.calls.filter(([{ url }]) => url === 'core/v4/members/search')).toHaveLength(1);
});

it('keeps the last manager of an account that has managers, but allows replacing it', () => {
    const alice = { MemberID: 'alice-member', Name: 'Org Alice', Email: 'alice@example.test' };
    const bob = { MemberID: 'bob-member', Name: 'Org Bob', Email: 'bob@example.test' };
    const props = { ...getProps(), existingMemberIDs: [alice.MemberID] };
    const { rerender } = render(<ServiceAccountManagers {...props} selected={[alice]} />);
    expect(screen.queryByRole('button', { name: 'Remove Org Alice' })).not.toBeInTheDocument();

    rerender(<ServiceAccountManagers {...props} selected={[alice, bob]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Org Alice' }));
    expect(props.onChange).toHaveBeenLastCalledWith([bob]);
});

it('allows removing the only selected manager of an account without managers', () => {
    const alice = { MemberID: 'alice-member', Name: 'Org Alice', Email: 'alice@example.test' };
    render(<ServiceAccountManagers {...getProps()} selected={[alice]} />);
    expect(screen.getByRole('button', { name: 'Remove Org Alice' })).toBeInTheDocument();
});
