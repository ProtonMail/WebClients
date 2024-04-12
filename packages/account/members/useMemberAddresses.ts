import { useEffect } from 'react';

import { type Action, type ThunkDispatch, createSelector } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { baseUseDispatch, baseUseSelector } from '@proton/redux-shared-store/sharedContext';
import type { Address, EnhancedMember, PartialMemberAddress } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { type AddressesState, selectAddresses } from '../addresses';
import { type MembersState, getMemberAddresses, selectMembers } from './index';

type Result = {
    [key: string]: (PartialMemberAddress | Address)[] | undefined;
};

const selector = createSelector(
    [(state: MembersState) => selectMembers(state), (state: AddressesState) => selectAddresses(state)],
    (membersState, addressesState): Result => {
        const members = membersState.value || [];
        return Object.fromEntries(
            members.map((member) => {
                if (member.Self) {
                    return [member.ID, addressesState.value];
                }
                return [member.ID, member.Addresses];
            })
        );
    }
);

export const useMemberAddresses = ({
    members,
    partial,
}: {
    members: EnhancedMember[] | undefined;
    partial?: boolean;
}) => {
    const dispatch = baseUseDispatch<ThunkDispatch<MembersState, ProtonThunkArguments, Action>>();
    const value = baseUseSelector<MembersState, Result>(selector);

    const retry = (members: EnhancedMember[]) => {
        members.forEach((member) => {
            dispatch(getMemberAddresses({ member, retry: true })).catch(noop);
        });
    };

    useEffect(() => {
        if (!members) {
            return;
        }
        members.forEach((member) => {
            if (member.addressState === 'partial' && !!member.Addresses && partial) {
                // Ignore
                return;
            }
            if (member.addressState === 'stale' || member.addressState === 'partial' || !member.Addresses) {
                dispatch(getMemberAddresses({ member })).catch(noop);
            }
        });
    }, [members, partial]);

    return { retry, value };
};
