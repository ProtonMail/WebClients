import { useCallback, useEffect } from 'react';

import { type Action, type ThunkDispatch } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import { type GroupMemberByIDByGroupID, type GroupMembersState, groupMembersThunk, selectGroupMembers } from './index';

export const useGetGroupMembers = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<GroupMembersState, ProtonThunkArguments, Action>>();

    return useCallback(async (groupId: string | undefined) => {
        if (!groupId || groupId === 'new') {
            return undefined;
        }
        return dispatch(groupMembersThunk({ groupId }));
    }, []);
};

export const useGroupMembers = (groupId: string | undefined) => {
    const getGroupMembers = useGetGroupMembers();
    const selectedValue = baseUseSelector<GroupMembersState, GroupMemberByIDByGroupID>(selectGroupMembers);

    useEffect(() => {
        void getGroupMembers(groupId);
    }, [groupId, getGroupMembers]);

    const group = selectedValue[groupId || ''];

    return [group?.value, group === undefined] as const;
};
