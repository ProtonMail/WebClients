import { type ReactNode, useState } from 'react';

import { c, msgid } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcShareNode } from '@proton/icons/icons/IcShareNode';
import { BRAND_NAME, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { Group, MemberReadyForManualUnprivatization } from '@proton/shared/lib/interfaces';
import type { GroupMember } from '@proton/shared/lib/interfaces/GroupMember';
import { useFlag } from '@proton/unleash/useFlag';

import './ScimSetupModal.scss';

enum ItemStatus {
    Waiting = 'waiting',
    Finalizing = 'finalizing',
    Completed = 'completed',
    Unknown = 'unknown',
}

enum Phase {
    Idle = 'idle',
    Working = 'working',
    Done = 'done',
}

interface PendingUserItem {
    member: MemberReadyForManualUnprivatization;
    status: ItemStatus;
}

interface PendingGroupMemberItem {
    member: GroupMember;
    status: ItemStatus;
}

interface PendingGroupItem {
    group: Group;
    members: PendingGroupMemberItem[];
    status: ItemStatus;
}

interface Props extends ModalProps {
    users: PendingUserItem[];
    groups: PendingGroupItem[];
    phase: Phase;
    onFinish: () => void;
}

const StatusBadge = ({ status }: { status: ItemStatus }) => {
    switch (status) {
        case ItemStatus.Waiting:
            return <span className="text-sm color-hint text-semibold">{c('Status').t`... waiting`}</span>;
        case ItemStatus.Finalizing:
            return (
                <span className="inline-flex items-center gap-1 text-semibold color-primary">
                    <IcArrowsRotate className="scim-spin" />
                    {c('Status').t`finalizing`}
                </span>
            );
        case ItemStatus.Completed:
            return (
                <span className="inline-flex items-center gap-1 text-sm color-success">
                    <IcCheckmarkCircleFilled />
                    {c('Status').t`completed`}
                </span>
            );
        case ItemStatus.Unknown:
        default:
            return null;
    }
};

const UserInfoRow = ({
    name,
    email,
    status,
    isPrivate,
}: {
    name: string;
    email?: string;
    status: ItemStatus;
    isPrivate?: boolean;
}) => (
    <div className="flex items-center gap-3 py-3">
        <Avatar className="shrink-0 text-rg" color="weak">
            {getInitials(name)}
        </Avatar>
        <div className="flex-1 min-w-0">
            <span className="flex items-center gap-1">
                <span className="m-0 text-ellipsis" title={name}>
                    {name}
                </span>
                {isPrivate && <IcKey className="shrink-0 color-weak" alt={c('scim').t`Private user`} />}
            </span>
            {email && (
                <p className="m-0 text-sm color-weak text-ellipsis" title={email}>
                    {email}
                </p>
            )}
        </div>
        <StatusBadge status={status} />
    </div>
);

const Section = ({
    label,
    sectionStatus,
    expanded,
    onToggle,
    children,
}: {
    label: string;
    sectionStatus: ItemStatus;
    expanded: boolean;
    onToggle: () => void;
    children: ReactNode;
}) => {
    return (
        <div className="border-bottom">
            <button
                type="button"
                className="w-full flex items-center justify-space-between py-3 text-left"
                onClick={onToggle}
            >
                <span className="block">
                    <span className="block text-bold">{label}</span>
                    <span className="block mt-1 text-sm color-weak">{c('scim').t`From your identity provider`}</span>
                </span>
                <span className="flex items-center gap-2">
                    {!expanded && <StatusBadge status={sectionStatus} />}
                    <Icon name={expanded ? 'chevron-up' : 'chevron-down'} className="shrink-0" />
                </span>
            </button>
            {expanded && <div className="pb-3">{children}</div>}
        </div>
    );
};

const GroupInfoRow = ({
    group,
    members,
    status,
    expanded,
    onToggle,
}: PendingGroupItem & {
    expanded: boolean;
    onToggle: () => void;
}) => {
    const memberCount = members.length;
    const hasMembers = memberCount > 0;

    const header = (
        <>
            <span
                className="rounded flex items-center justify-center shrink-0 w-custom h-custom"
                style={{
                    '--w-custom': '2rem',
                    '--h-custom': '2rem',
                    backgroundColor: 'var(--interaction-norm-minor-1)',
                }}
            >
                <IcShareNode className="m-auto color-primary shrink-0" size={4} />
            </span>
            <span className="block flex-1 min-w-0">
                <span className="block text-ellipsis text-bold" title={group.Name}>
                    {group.Name}
                </span>
                <span className="scim-group-meta block text-sm color-weak">
                    {/* translator: full sentence will be "Updated/New • {number} new member/s" */}
                    <span>{!group.Address.HasKeys ? c('scim').t`New` : c('scim').t`Updated`}</span>
                    <span className="new-member">
                        {c('scim').ngettext(
                            msgid`${memberCount} new member`,
                            `${memberCount} new members`,
                            memberCount
                        )}
                    </span>
                </span>
            </span>
            <span className="flex items-center gap-2">
                {<StatusBadge status={status} />}
                {hasMembers && <Icon name={expanded ? 'chevron-up' : 'chevron-down'} className="shrink-0" />}
            </span>
        </>
    );

    return (
        <div>
            {hasMembers ? (
                <button type="button" className="w-full flex items-center gap-3 py-3 text-left" onClick={onToggle}>
                    {header}
                </button>
            ) : (
                <div className="flex items-center gap-3 py-3">{header}</div>
            )}
            {expanded && hasMembers && (
                <div className="pl-11">
                    {members.map(({ member, status: memberStatus }) => (
                        <UserInfoRow key={member.ID} name={member.Email ?? ''} status={memberStatus} />
                    ))}
                </div>
            )}
        </div>
    );
};

const getSectionStatus = (statuses: ItemStatus[]): ItemStatus => {
    if (statuses.some((status) => status === ItemStatus.Finalizing)) {
        return ItemStatus.Finalizing;
    }

    if (statuses.some((status) => status === ItemStatus.Waiting)) {
        return ItemStatus.Waiting;
    }

    if (statuses.every((status) => status === ItemStatus.Completed)) {
        return ItemStatus.Completed;
    }

    return ItemStatus.Unknown;
};

const ScimSetupModal = ({ users, groups, phase, onFinish, onClose, ...rest }: Props) => {
    const isUserGroupsScimGroupsEnabled = useFlag('UserGroupsScimGroups');

    const [usersExpanded, setUsersExpanded] = useState(false);
    const [groupsExpanded, setGroupsExpanded] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const numberOfPendingUsers = users.length;
    const numberOfPendingGroups = groups.length;

    if (!isUserGroupsScimGroupsEnabled || (!numberOfPendingUsers && !numberOfPendingGroups)) {
        return null;
    }

    return (
        <ModalTwo {...rest} onClose={onClose} size="large">
            <ModalTwoHeader
                title={c('Title').t`Approve changes`}
                additionalContent={
                    <p className="mt-0 mb-1 color-weak">
                        {c('scim').t`Once approved, they can access all ${BRAND_NAME} services and share securely.`}
                    </p>
                }
            />
            <ModalTwoContent>
                <p className="mb-4 text-md">{c('scim').t`Review users and groups before finishing setup`}</p>

                <div className="scim-setup-list">
                    {numberOfPendingUsers > 0 && (
                        <Section
                            label={c('scim').ngettext(
                                msgid`${numberOfPendingUsers} user synced`,
                                `${numberOfPendingUsers} users synced`,
                                numberOfPendingUsers
                            )}
                            sectionStatus={getSectionStatus(users.map((user) => user.status))}
                            expanded={usersExpanded}
                            onToggle={() => setUsersExpanded(!usersExpanded)}
                        >
                            {users.map(({ member, status }) => (
                                <UserInfoRow
                                    key={member.ID}
                                    name={member.Name}
                                    email={member.Addresses?.[0]?.Email}
                                    status={status}
                                    isPrivate={member.Private === MEMBER_PRIVATE.UNREADABLE}
                                />
                            ))}
                        </Section>
                    )}

                    {numberOfPendingGroups > 0 && (
                        <Section
                            label={c('scim').ngettext(
                                msgid`${numberOfPendingGroups} group synced`,
                                `${numberOfPendingGroups} groups synced`,
                                numberOfPendingGroups
                            )}
                            sectionStatus={getSectionStatus(groups.map((group) => group.status))}
                            expanded={groupsExpanded}
                            onToggle={() => setGroupsExpanded((isGroupsExpanded) => !isGroupsExpanded)}
                        >
                            {groups.map((groupItem) => (
                                <GroupInfoRow
                                    key={groupItem.group.ID}
                                    {...groupItem}
                                    expanded={!!expandedGroups[groupItem.group.ID]}
                                    onToggle={() =>
                                        setExpandedGroups((prev) => ({
                                            ...prev,
                                            [groupItem.group.ID]: !prev[groupItem.group.ID],
                                        }))
                                    }
                                />
                            ))}
                        </Section>
                    )}
                </div>

                <div className="color-hint mt-4 flex flex-nowrap gap-2 items-start">
                    <IcInfoCircle className="shrink-0 mt-1" />
                    <span>
                        {c('scim')
                            .t`Users that you have set to private need to accept the invite to finish setup. We'll send them an invite once you approve.`}
                    </span>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose} disabled={phase === Phase.Working}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button
                    color="norm"
                    loading={phase === Phase.Working}
                    onClick={phase === Phase.Done ? onClose : onFinish}
                >
                    {phase === Phase.Done ? c('Action').t`Close` : c('Action').t`Finish`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ScimSetupModal;
