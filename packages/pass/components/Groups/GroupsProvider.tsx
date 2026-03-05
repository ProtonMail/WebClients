import type { FC, ReactNode } from 'react';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { GroupMembersModal } from '@proton/pass/components/Groups/GroupMembersModal';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useRequest } from '@proton/pass/hooks/useRequest';
import type { Group, GroupId, GroupMembersResponse } from '@proton/pass/lib/groups/groups.types';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import { getGroupMembers, getGroups } from '@proton/pass/store/actions/creators/groups';
import { selectOrganization, selectPassPlan } from '@proton/pass/store/selectors';
import { selectGroupByEmail, selectGroups } from '@proton/pass/store/selectors/groups';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import noop from '@proton/utils/noop';

type GroupsContextValue = {
    organizationGroups: Group[];
    groupsMembers: Record<GroupId, GroupMembersResponse>;
    fetchGroupMembers: (groupId: GroupId) => void;
    onShowMembers: (groupId: GroupId) => void;
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

    const onShowMembers = useCallback((groupId: GroupId) => setModalOpen(groupId), []);

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
    isGroup: boolean;
    onShowMembers: () => void;
};

export const useMaybeGroup = (email: Maybe<string>): UseMaybeGroup => {
    const { groupsMembers, fetchGroupMembers, onShowMembers: onShowMembersById } = useGroups();
    const group = useSelector(selectGroupByEmail(email ?? ''));

    useEffect(() => {
        if (group) fetchGroupMembers(group.groupId);
    }, [group?.groupId]);

    const { name, isGroup } = useMemo(() => {
        if (!group) return { name: email ?? '', isGroup: false };
        const memberCount = groupsMembers[group.groupId]?.members.length;
        if (memberCount === undefined) return { name: group.name, isGroup: true };
        const count = c('Info').ngettext(msgid`(${memberCount} member)`, `(${memberCount} members)`, memberCount);
        return { name: `${group.name} ${count}`, isGroup: true };
    }, [email, group, groupsMembers]);

    const onShowMembers = useCallback(group ? () => onShowMembersById(group?.groupId) : noop, [group?.groupId]);

    return { name, isGroup, onShowMembers };
};
