import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import type { EnhancedMember, Member } from '@proton/shared/lib/interfaces/Member';
import type { RoleAssignment } from '@proton/shared/lib/interfaces/OrganizationRole';

import { type MembersState, membersActions, membersReducer } from './index';
import {
    type MembersPageState,
    fetchMembersPage,
    membersPageReducer,
    selectMembersPage,
    selectMembersPageRows,
} from './membersPage';

const getMember = (ID: string, member: Partial<Member> = {}) => ({ ID, Name: ID, ...member }) as Member;

type Response = { Members: Member[]; Total: number; More?: boolean };

const getMembersState = (value: EnhancedMember[]): MembersState['members'] => ({
    value,
    error: undefined,
    meta: { type: 1, fetchedAt: 1_700_000_000, fetchedEphemeral: true },
    unprivatization: { members: {}, loading: { approval: false, automatic: false } },
});

const setup = ({
    responses,
    listMembers,
}: {
    responses: (Response | Promise<Response>)[];
    listMembers?: EnhancedMember[];
}) => {
    const api = vi.fn(async () => {
        const response = responses.shift();
        if (!response) {
            throw new Error('no response');
        }
        return response;
    });
    const { store } = getTestStore({
        reducer: { ...membersPageReducer, ...membersReducer },
        preloadedState: listMembers ? { members: getMembersState(listMembers) } : undefined,
        extraThunkArguments: { api } as unknown as ProtonThunkArguments,
    });
    const load = (options: { keywords?: string; refetch?: boolean } = {}) =>
        store.dispatch(fetchMembersPage({ page: 1, pageSize: 10, ...options }));
    const page = () => selectMembersPage(store.getState());
    return { store, api, load, page };
};

describe('membersPage', () => {
    it('stores the fetched page and its total', async () => {
        const { load, page } = setup({ responses: [{ Members: [getMember('a'), getMember('b')], Total: 25 }] });

        await load();

        expect(page()).toMatchObject({ members: [getMember('a'), getMember('b')], total: 25, loading: false });
    });

    it('counts the search results when the search total is not exact', async () => {
        const { load, page } = setup({ responses: [{ Members: [getMember('a')], Total: 500, More: false }] });

        await load({ keywords: 'a' });

        expect(page().total).toBe(1);
    });

    it('reuses search results for the same keywords until asked to refetch', async () => {
        const { api, load } = setup({
            responses: [
                { Members: [getMember('a')], Total: 1 },
                { Members: [getMember('a')], Total: 1 },
            ],
        });

        await load({ keywords: 'a', refetch: false });
        await load({ keywords: 'a', refetch: false });
        expect(api).toHaveBeenCalledTimes(1);

        await load({ keywords: 'a', refetch: true });
        expect(api).toHaveBeenCalledTimes(2);
    });

    it('keeps the answer to the latest request when an older one arrives after it', async () => {
        let answerFirst!: (response: Response) => void;
        const first = new Promise<Response>((resolve) => {
            answerFirst = resolve;
        });
        const { load, page } = setup({ responses: [first, { Members: [getMember('new')], Total: 1 }] });

        const firstLoad = load();
        await load();
        answerFirst({ Members: [getMember('old')], Total: 1 });
        await firstLoad;

        expect(page().members).toEqual([getMember('new')]);
        expect(page().loading).toBe(false);
    });

    it('stores the error of a failed request, but not of an aborted one', async () => {
        const { load, page } = setup({ responses: [] });
        await load();
        expect(page()).toMatchObject({ loading: false, error: { message: 'no response' } });

        const aborted = setup({ responses: [new Promise<Response>(() => {})] });
        const request = aborted.load();
        request.abort();
        await request;
        expect(aborted.page()).toMatchObject({ loading: false, error: undefined });
    });

    it('builds the rows with the roles the members list has, and splits search results into pages', async () => {
        const roles = [{ OrganizationID: 'organization' }] as RoleAssignment[];
        const listMember = {
            ...getMember('b'),
            roleState: 'full',
            UserOrganizationRoles: roles,
            requiresOrgKeyPromotion: true,
        } as EnhancedMember;
        const results = Array.from({ length: 12 }, (_, index) => getMember(index === 11 ? 'b' : `m${index}`));
        const { store, load } = setup({ responses: [{ Members: results, Total: 12 }], listMembers: [listMember] });

        await load({ keywords: 'm' });

        // The members list's other state (user, addresses, permissions) isn't needed to build the rows
        const secondPage = selectMembersPageRows(store.getState() as MembersPageState & MembersState, 2, 10);
        expect(secondPage.map(({ ID }) => ID)).toEqual(['m10', 'b']);
        expect(secondPage[0]).toMatchObject({
            roleState: 'initial',
            UserOrganizationRoles: [],
            addressState: 'partial',
        });
        expect(secondPage[1]).toMatchObject({
            roleState: 'full',
            UserOrganizationRoles: roles,
            requiresOrgKeyPromotion: true,
            addressState: 'partial',
        });
    });

    it('shows a member saved elsewhere, keeping the addresses the page loaded', async () => {
        const addresses = [{ ID: 'address', Email: 'a@example.com' }] as Member['Addresses'];
        const { store, load, page } = setup({
            responses: [{ Members: [getMember('a', { Addresses: addresses }), getMember('b')], Total: 2 }],
        });
        await load();

        store.dispatch(membersActions.upsertMember({ member: getMember('a', { Name: 'renamed' }) }));

        expect(page().members[0]).toEqual(getMember('a', { Name: 'renamed', Addresses: addresses }));
    });

    it('drops deleted members and ignores members that are not on the page', async () => {
        const { store, load, page } = setup({ responses: [{ Members: [getMember('a'), getMember('b')], Total: 2 }] });
        await load();
        const before = page();

        store.dispatch(membersActions.upsertMember({ member: getMember('elsewhere', { Name: 'renamed' }) }));
        expect(page()).toBe(before);

        store.dispatch(membersActions.eventLoopV6({ upsert: [getMember('new')], delete: ['a'] }));
        expect(page().members).toEqual([getMember('b')]);
    });
});
