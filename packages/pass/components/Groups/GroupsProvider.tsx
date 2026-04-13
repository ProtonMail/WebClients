import type { FC, MouseEvent, ReactNode } from 'react';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { GroupMembersModal } from '@proton/pass/components/Groups/GroupMembersModal';
import type { MaybeGroupProps } from '@proton/pass/components/Groups/MaybeGroupName';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useRequest } from '@proton/pass/hooks/useRequest';
import type { Group, GroupId, GroupMembersResponse } from '@proton/pass/lib/groups/groups.types';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import { getGroupMembers, getGroups } from '@proton/pass/store/actions/creators/groups';
import { selectOrganization, selectPassPlan, selectUser } from '@proton/pass/store/selectors';
import { selectGroupByEmail, selectGroups } from '@proton/pass/store/selectors/groups';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import noop from '@proton/utils/noop';

type GroupsContextValue = {
    organizationGroups: Group[];
    groupsMembers: Record<GroupId, GroupMembersResponse>;
    fetchGroupMembers: (groupId: GroupId) => void;
    onShowMembers: (event: MouseEvent, groupId: GroupId) => void;
};

const initialValue: GroupsContextValue = {
    organizationGroups: [],
    groupsMembers: {},
    fetchGroupMembers: noop,
    onShowMembers: noop,
};

const GroupsContext = createContext<GroupsContextValue>(initialValue);

export const useGroups = createUseContext(GroupsContext);

type Props = {
    children: ReactNode;
};

/**
 * Fetch org groups, provide helpers to show groups including members modal
 * Don't use it at root level so we fetch groups only where needed
 */
export const GroupsProvider: FC<Props> = ({ children }) => {
    const dispatch = useDispatch();

    const plan = useSelector(selectPassPlan);
    const isB2b = isBusinessPlan(plan);
    const groupShareFeatureFlag = useFeatureFlag(PassFeature.PassGroupInvitesV1);
    const groups = useSelector(selectGroups);
    const organization = useSelector(selectOrganization);

    const [groupsMembers, setGroupsMembers] = useState<Record<GroupId, GroupMembersResponse>>({});
    const [modalOpen, setModalOpen] = useState<MaybeNull<GroupId>>(null);

    const groupMembersAction = useRequest(getGroupMembers, {
        onSuccess: (data) => setGroupsMembers((map) => ({ ...map, [data.groupId]: data })),
    });

    useEffect(() => {
        if (isB2b && groupShareFeatureFlag) dispatch(getGroups.intent());
    }, []);

    const onShowMembers = useCallback(
        (event: MouseEvent, groupId: GroupId) => {
            if ((groupsMembers[groupId]?.total ?? 0) > 0) {
                event.stopPropagation();
                event.preventDefault();
                setModalOpen(groupId);
            }
        },
        [groupsMembers]
    );

    const fetchGroupMembers = useCallback(
        (groupId: GroupId) => groupMembersAction.dispatch(groupId),
        [groupMembersAction]
    );

    const organizationGroups = useMemo(() => {
        if (!groupShareFeatureFlag) return [];
        return Object.values(groups).filter((group) => group?.organizationId === organization?.ID);
    }, [groupShareFeatureFlag, organization, groups]);

    const contextValue = useMemo(
        () => ({ organizationGroups, onShowMembers, fetchGroupMembers, groupsMembers }),
        [organizationGroups, onShowMembers, fetchGroupMembers, groupsMembers]
    );

    return (
        <GroupsContext.Provider value={contextValue}>
            {children}
            {modalOpen !== null && (
                <GroupMembersModal
                    name={groups[modalOpen]?.name ?? ''}
                    members={groupsMembers[modalOpen]?.members ?? []}
                    onClose={() => setModalOpen(null)}
                />
            )}
        </GroupsContext.Provider>
    );
};

type UseMaybeGroup = {
    name: string;
    maybeGroupProps: MaybeGroupProps;
    isGroup: boolean;
    isMember: boolean;
    groupIsLoading: boolean;
    onShowMembers: (event: MouseEvent) => void;
};

/**
 * Returns the name to show for the given email.
 * It may be the email itself for normal users but will be replaced
 * by the group name if it's a known group.
 * `inputGroupId` is optional and is used to know sooner to expect a group
 */
export const useMaybeGroup = (email: Maybe<string>, inputGroupId?: MaybeNull<string>): UseMaybeGroup => {
    const { groupsMembers, fetchGroupMembers, onShowMembers: onShowMembersById } = useGroups();
    const group = useSelector(selectGroupByEmail(email ?? ''));
    const user = useSelector(selectUser);

    useEffect(() => {
        if (group) fetchGroupMembers(group.groupId);
    }, [group?.groupId]);

    const { name, maybeGroupProps } = useMemo(() => {
        if (!group) {
            const name = email ?? '';
            return { name, maybeGroupProps: { name } };
        }
        const memberCount = groupsMembers[group.groupId]?.members.length;
        if (memberCount === undefined) {
            return { name: group.name, maybeGroupProps: { name: group.name } };
        }
        const count = c('Info').ngettext(msgid`(${memberCount} member)`, `(${memberCount} members)`, memberCount);
        return { name: `${group.name} ${count}`, maybeGroupProps: { name: group.name, count } };
    }, [email, group, groupsMembers]);

    // It's a group if the group is loaded or if we expect a group id
    const isGroup = !!group || !!inputGroupId;

    // If we know it's a group and the group is not loaded yet
    const groupIsLoading = isGroup && !group;

    const isMember = useMemo(() => {
        if (!group || !user?.Email) return false;
        const members = groupsMembers[group.groupId]?.members ?? [];
        return members.some((member) => member.email === user.Email);
    }, [group, groupsMembers, user?.Email]);

    const onShowMembers = useCallback(group ? (event: MouseEvent) => onShowMembersById(event, group?.groupId) : noop, [
        group?.groupId,
        onShowMembersById,
    ]);

    return { name, maybeGroupProps, isGroup, isMember, groupIsLoading, onShowMembers };
};
