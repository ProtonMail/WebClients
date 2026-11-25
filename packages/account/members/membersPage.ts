import type { SerializedError } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { queryMembers, searchMembers } from '@proton/shared/lib/api/members';
import type { EnhancedMember, Member } from '@proton/shared/lib/interfaces/Member';

import { type MembersState, type UpsertMemberPayload, membersActions, selectMembers, toEnhancedMember } from './index';

const name = 'membersPage' as const;

interface SliceState {
    /** One page of members, or every member matching `keywords` */
    members: Member[];
    total: number;
    /** The search the members are for, empty for a page of the whole list */
    keywords: string;
    loading: boolean;
    error: SerializedError | undefined;
    /** The latest request, so that the answer to an older one can't replace a newer one */
    requestID: string | undefined;
    /** The members list was loaded after the page, so the page may lack changes the list has */
    stale: boolean;
}

export interface MembersPageState {
    [name]: SliceState;
}

export const selectMembersPage = (state: MembersPageState) => state[name];

const initialState: SliceState = {
    members: [],
    total: 0,
    keywords: '',
    loading: false,
    error: undefined,
    requestID: undefined,
    stale: false,
};

/** Applies members saved elsewhere to the ones on the page. Members that aren't on the page are ignored. */
const updateMembers = (state: SliceState, { updated, deletedIDs }: { updated: Member[]; deletedIDs: string[] }) => {
    const updatedByID = new Map(updated.map((member) => [member.ID, member]));
    const deleted = new Set(deletedIDs);
    if (!state.members.some(({ ID }) => updatedByID.has(ID) || deleted.has(ID))) {
        return;
    }
    state.members = state.members
        .filter((member) => !deleted.has(member.ID))
        .map((member) => {
            const update = updatedByID.get(member.ID);
            // A single member fetch has no addresses, so the page's are kept
            return update ? { ...member, ...update } : member;
        });
};

const getUpsertChanges = (upserts: UpsertMemberPayload[]) => ({
    updated: upserts.filter(({ type }) => type !== 'delete').map(({ member }) => member),
    deletedIDs: upserts.filter(({ type }) => type === 'delete').map(({ member }) => member.ID),
});

interface MembersResponse {
    Members: Member[];
    Total: number;
    More?: boolean;
}

/**
 * Fetches one page of members, or every member matching the keywords. A search the page already
 * has results for isn't fetched again unless `refetch` is set.
 */
export const fetchMembersPage = createAsyncThunk<
    { members: Member[]; total: number; keywords: string },
    { page: number; pageSize: number; keywords?: string; refetch?: boolean },
    { state: MembersPageState; extra: ProtonThunkArguments }
>(
    `${name}/fetch`,
    async ({ page, pageSize, keywords = '' }, { extra, signal }) => {
        const api = getSilentApi(extra.api);
        const { Members, Total, More } = await api<MembersResponse>({
            ...(keywords ? searchMembers(keywords) : queryMembers({ Page: page - 1, PageSize: pageSize })),
            signal,
        });
        // There's an implementation restriction in the API, the Total field is not always accurate for searchMembers when the result is too large,
        // as a workaround there'll be an extra boolean field `More` to indicate that we should use actual members length instead of Total.
        const total = !keywords || More ? Total : Members.length;
        return { members: Members, total, keywords };
    },
    {
        condition: ({ keywords = '', refetch = true }, { getState }) => {
            const state = selectMembersPage(getState());
            return !keywords || keywords !== state.keywords || !!state.error || refetch;
        },
    }
);

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchMembersPage.pending, (state, action) => {
            state.requestID = action.meta.requestId;
            state.loading = true;
            state.error = undefined;
            state.stale = false;
        });
        builder.addCase(fetchMembersPage.fulfilled, (state, action) => {
            if (action.meta.requestId !== state.requestID) {
                return;
            }
            state.members = action.payload.members;
            state.total = action.payload.total;
            state.keywords = action.payload.keywords;
            state.loading = false;
        });
        builder.addCase(fetchMembersPage.rejected, (state, action) => {
            if (action.meta.requestId !== state.requestID) {
                return;
            }
            state.loading = false;
            state.error = action.meta.aborted ? undefined : action.error;
        });
        // Edits and server events reach the members list through these actions, so the page gets them too
        builder.addCase(membersActions.upsertMember, (state, { payload }) => {
            updateMembers(state, getUpsertChanges([payload]));
        });
        builder.addCase(membersActions.upsertMembers, (state, { payload }) => {
            updateMembers(state, getUpsertChanges(payload));
        });
        builder.addCase(membersActions.eventLoopV6, (state, { payload }) => {
            updateMembers(state, { updated: payload.upsert, deletedIDs: payload.delete });
        });
        // A big batch of member events (see `membersEventLoopV6Thunk`) reloads the whole list instead, and the events
        // that arrive while the list loads are dropped. The list can hold data older than the page (a big org's list
        // takes tens of seconds to load), so the page is fetched again rather than merged with it.
        builder.addCase(membersActions.fulfilled, (state) => {
            state.stale = true;
        });
    },
});

export const membersPageReducer = { [name]: slice.reducer };

/**
 * The members to show on a page, with the roles and org key state the members list has for them.
 * Search results are all loaded at once and split into pages here.
 */
export const selectMembersPageRows = createSelector(
    [
        selectMembersPage,
        (state: MembersState) => selectMembers(state).value,
        (_state: MembersPageState & MembersState, page: number) => page,
        (_state: MembersPageState & MembersState, _page: number, pageSize: number) => pageSize,
    ],
    ({ members, keywords }, listMembers, page, pageSize): EnhancedMember[] => {
        const actualPage = Math.min(page, Math.ceil(members.length / pageSize));
        const pageMembers = keywords ? members.slice(pageSize * (actualPage - 1), pageSize * actualPage) : members;
        const pageIDs = new Set(pageMembers.map(({ ID }) => ID));
        const listMembersByID = new Map(
            listMembers?.filter(({ ID }) => pageIDs.has(ID)).map((member) => [member.ID, member])
        );
        return pageMembers.map((member) => {
            const listMember = listMembersByID.get(member.ID);
            return {
                // Partial addresses, so that useMemberAddresses doesn't fetch the addresses of every member on the page
                ...toEnhancedMember(member),
                ...(listMember && {
                    roleState: listMember.roleState,
                    UserOrganizationRoles: listMember.UserOrganizationRoles,
                    requiresOrgKeyPromotion: listMember.requiresOrgKeyPromotion,
                    requiresOrgKeyDemotion: listMember.requiresOrgKeyDemotion,
                    hasScheduledOrgKeyDemotion: listMember.hasScheduledOrgKeyDemotion,
                }),
            };
        });
    }
);
