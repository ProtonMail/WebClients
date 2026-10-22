import { type ReactNode, useState } from 'react';

import { c, msgid } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { ItemStatus, Phase } from '@proton/account/scimSetup';
import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Button } from '@proton/atoms/Button/Button';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcBroom } from '@proton/icons/icons/IcBroom';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcChevronUp } from '@proton/icons/icons/IcChevronUp';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcCrossCircleFilled } from '@proton/icons/icons/IcCrossCircleFilled';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcKey } from '@proton/icons/icons/IcKey';
import { BRAND_NAME, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { Group } from '@proton/shared/lib/interfaces/Group';
import type { GroupMember } from '@proton/shared/lib/interfaces/GroupMember';
import type { EnhancedMember, MemberReadyForManualUnprivatization } from '@proton/shared/lib/interfaces/Member';
import { useFlag } from '@proton/unleash/useFlag';

import type { ModalProps } from '../../components/modalTwo/Modal';
import ModalTwo from '../../components/modalTwo/Modal';
import ModalTwoContent from '../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../components/modalTwo/ModalHeader';
import GroupIcon from './groups/GroupIcon';

import './ScimSetupModal.scss';

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

interface PendingCleanUpItem {
    member: EnhancedMember;
    status: ItemStatus;
}

interface Props extends ModalProps {
    users: PendingUserItem[];
    groups: PendingGroupItem[];
    cleanUps: PendingCleanUpItem[];
    pendingMembers: Record<string, GroupMember[]>;
    phase: Phase;
    onFinish: () => void;
}

const StatusBadge = ({ status }: { status: ItemStatus }) => {
    switch (status) {
        case ItemStatus.Waiting:
            return <span className="color-hint text-sm text-bold">{c('Status').t`... waiting`}</span>;
        case ItemStatus.Finalizing:
            return (
                <span className="inline-flex items-center gap-1 text-sm text-bold color-primary">
                    <IcArrowsRotate className="scim-spin" />
                    {c('Status').t`finalizing`}
                </span>
            );
        case ItemStatus.Completed:
            return (
                <span className="inline-flex items-center gap-1 text-sm text-bold color-success">
                    <IcCheckmarkCircleFilled />
                    {c('Status').t`completed`}
                </span>
            );
        case ItemStatus.Scheduled:
            return (
                <span className="inline-flex items-center gap-1 text-sm text-bold color-success">
                    <IcClock />
                    {c('Status').t`key removal scheduled`}
                </span>
            );
        case ItemStatus.Failed:
            return (
                <span className="inline-flex items-center gap-1 text-sm text-bold color-danger">
                    <IcCrossCircleFilled />
                    {c('Status').t`failed`}
                </span>
            );
        case ItemStatus.Unknown:
        default:
            return null;
    }
};

const RemoveOrgKeyBadge = () => (
    <span className="inline-flex items-center gap-1 text-sm color-info">
        <IcBroom />
        {c('Status').t`remove organization key`}
    </span>
);

const UserInfoRow = ({
    name,
    email,
    status,
    isPrivate,
    unknownStatusBadge,
}: {
    name: string;
    email?: string;
    status: ItemStatus;
    isPrivate?: boolean;
    unknownStatusBadge?: ReactNode;
}) => (
    <div className="flex items-center gap-3 py-2">
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
        <span className="mr-6">
            {status === ItemStatus.Unknown && unknownStatusBadge ? unknownStatusBadge : <StatusBadge status={status} />}
        </span>
    </div>
);

const Section = ({
    label,
    sectionStatus,
    expanded,
    onToggle,
    hideScimTexts,
    children,
}: {
    label: string;
    sectionStatus: ItemStatus;
    expanded: boolean;
    onToggle: () => void;
    hideScimTexts?: boolean;
    children: ReactNode;
}) => {
    const ChevronIcon = expanded ? IcChevronUp : IcChevronDown;

    return (
        <div className="border-bottom mb-2 pb-2">
            <button
                type="button"
                className="w-full flex items-center justify-space-between py-2 text-left"
                onClick={onToggle}
            >
                <span className="block">
                    <span className="block text-bold">{label}</span>
                    {!hideScimTexts && (
                        <span className="block mt-1 text-sm color-weak">{c('scim')
                            .t`From your identity provider`}</span>
                    )}
                </span>
                <span className="flex items-center gap-2">
                    {!expanded && <StatusBadge status={sectionStatus} />}
                    <ChevronIcon className="shrink-0" />
                </span>
            </button>
            {expanded && <div>{children}</div>}
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

    const ChevronIcon = expanded ? IcChevronUp : IcChevronDown;

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
                <GroupIcon className="m-auto color-primary shrink-0" isScimGroup size={4} />
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
                {hasMembers && <ChevronIcon className="shrink-0" />}
            </span>
        </>
    );

    return (
        <div>
            {hasMembers ? (
                <button type="button" className="w-full flex items-center gap-3 py-2 text-left" onClick={onToggle}>
                    {header}
                </button>
            ) : (
                <div className="flex items-center gap-3 py-2">{header}</div>
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

    if (statuses.some((status) => status === ItemStatus.Failed)) {
        return ItemStatus.Failed;
    }

    if (statuses.every((status) => status === ItemStatus.Completed || status === ItemStatus.Scheduled)) {
        return statuses.includes(ItemStatus.Scheduled) ? ItemStatus.Scheduled : ItemStatus.Completed;
    }

    return ItemStatus.Unknown;
};

const ScimSetupModal = ({ users, groups, cleanUps, pendingMembers, phase, onFinish, onClose, ...rest }: Props) => {
    const isUserGroupsScimGroupsEnabled = useFlag('UserGroupsScimGroups');
    const [organization] = useOrganization();

    const [usersExpanded, setUsersExpanded] = useState(false);
    const [groupsExpanded, setGroupsExpanded] = useState(false);
    const [cleanUpsExpanded, setCleanUpsExpanded] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const numberOfPendingUsers = users.length;
    const numberOfPendingGroups = groups.length;
    const numberOfCleanUps = cleanUps.length;

    // Without SCIM, only clean-ups unrelated to an identity provider can be pending here. To be extracted into a
    // standalone banner and modal: https://protonag.atlassian.net/browse/B2B-689
    const isPermissionChangesOnly = !organization?.IsScimEnabled && !numberOfPendingUsers && !numberOfPendingGroups;

    const getGroupMemberItems = ({ group, members }: PendingGroupItem): PendingGroupMemberItem[] => {
        const statusByMemberId = new Map(members.map(({ member, status }) => [member.ID, status]));

        return (pendingMembers[group.ID] ?? []).map((member) => ({
            member,
            status: statusByMemberId.get(member.ID) ?? ItemStatus.Waiting,
        }));
    };

    if (!isUserGroupsScimGroupsEnabled || (!numberOfPendingUsers && !numberOfPendingGroups && !numberOfCleanUps)) {
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
                {!isPermissionChangesOnly && (
                    <p className="mb-4 text-md">{c('scim').t`Review users and groups before finishing setup`}</p>
                )}

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
                                    members={getGroupMemberItems(groupItem)}
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

                    {numberOfCleanUps > 0 && (
                        <Section
                            label={c('scim').ngettext(
                                msgid`${numberOfCleanUps} clean up action required`,
                                `${numberOfCleanUps} clean up actions required`,
                                numberOfCleanUps
                            )}
                            sectionStatus={getSectionStatus(cleanUps.map((cleanUp) => cleanUp.status))}
                            expanded={cleanUpsExpanded}
                            onToggle={() => setCleanUpsExpanded((isCleanUpsExpanded) => !isCleanUpsExpanded)}
                            hideScimTexts={isPermissionChangesOnly}
                        >
                            {cleanUps.map(({ member, status }) => (
                                <UserInfoRow
                                    key={member.ID}
                                    name={member.Name}
                                    email={member.Addresses?.[0]?.Email}
                                    status={status}
                                    unknownStatusBadge={<RemoveOrgKeyBadge />}
                                />
                            ))}
                        </Section>
                    )}
                </div>

                {!isPermissionChangesOnly && (
                    <div className="color-hint mt-4 flex flex-nowrap gap-2">
                        <IcInfoCircle className="shrink-0 mt-0.5" />
                        <span>
                            {c('scim')
                                .t`Users set to private need to accept the invite to finish setup. We'll send them an invite once you approve.`}
                        </span>
                    </div>
                )}
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
                    {phase === Phase.Done ? c('Action').t`Close` : c('Action').t`Approve`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ScimSetupModal;
