import type { ReactNode } from 'react';
import { Fragment } from 'react';

import { c } from 'ttag';

import { resumeGroupMember as resumeGroupMemberAction, updateOverridePermissions } from '@proton/account';
import { addGroupOwnerThunk } from '@proton/account/groups/addGroupOwner';
import { Button } from '@proton/atoms/Button/Button';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { useDispatch } from '@proton/redux-shared-store';
import {
    reinviteGroupMember,
    resumeGroupMember as resumeGroupMemberApi,
    deleteGroupMember as revokeGroupInvitation,
    updateGroupMember,
} from '@proton/shared/lib/api/groups';
import { clearBit, hasBit, setBit } from '@proton/shared/lib/helpers/bitset';
import type { Group, GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_PERMISSIONS, GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import useGroupKeys from './useGroupKeys';

interface PermissionOption {
    label: string;
    value: GROUP_MEMBER_PERMISSIONS;
}

const Option = ({
    option,
    isSelected,
    onSelect,
    disabled,
}: {
    option: PermissionOption;
    isSelected?: boolean;
    onSelect: (value: GROUP_MEMBER_PERMISSIONS) => void;
    disabled: boolean;
}) => {
    return (
        <DropdownMenuButton
            className="text-left flex justify-space-between items-center py-2 pb-3"
            key={option.value}
            onClick={() => onSelect(option.value)}
            disabled={disabled}
        >
            <span className="flex items-center mr-14">{option.label}</span>
            {isSelected ? <IcCheckmark className="color-primary" /> : null}
        </DropdownMenuButton>
    );
};

interface Props {
    member: GroupMember;
    group: Group; // needs to be removed once backend doesn't need Group.ID
    canOnlyDelete: boolean;
    canChangeVisibility: boolean;
}

// Did not find an already existing implementation of jsxJoin
const jsxJoin = (array: ReactNode[], separator: ReactNode): ReactNode[] => {
    const [first, ...rest] = array;
    return rest.reduce(
        (acc: ReactNode[], val: ReactNode, i: number) => [
            ...acc,
            // eslint-disable-next-line react/no-array-index-key
            <Fragment key={i}>{separator}</Fragment>,
            val,
        ],
        [first] as ReactNode[]
    );
};

const GroupMemberItemDropdown = ({ member, group, canOnlyDelete, canChangeVisibility }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const api = useApi();
    const handleError = useErrorHandler();
    const { call } = useEventManager();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const { getMemberPublicKeys } = useGroupKeys();

    const isGroupOwner = hasBit(member.Permissions, GROUP_MEMBER_PERMISSIONS.OWNER);
    const isGroupOwnersEnabled = useFlag('UserGroupsGroupOwner');

    const memberPermissionOptions: PermissionOption[] = [
        { label: c('Action').t`Use group sending permissions`, value: GROUP_MEMBER_PERMISSIONS.NONE },
        {
            label: c('Action').t`Always allow sending`,
            value: GROUP_MEMBER_PERMISSIONS.SEND,
        },
    ];

    const handleRevokeInvitation = async () => {
        await api(revokeGroupInvitation(member.ID));
        await call();
    };

    const handleResumeInvitation = async () => {
        try {
            await api(resumeGroupMemberApi(member.ID));
            dispatch(
                resumeGroupMemberAction({
                    groupID: group.ID,
                    memberID: member.ID,
                })
            );
        } catch (error) {
            handleError(error);
        }
    };

    const handleResendInvitation = async () => {
        try {
            await api(reinviteGroupMember(member.ID));
            createNotification({ text: c('Success notification').t`Resent invitation` });
        } catch (error) {
            handleError(error);
        }
    };

    const handleOverrideGroupPermissions = async (value: number) => {
        try {
            const newPermissions = setBit(clearBit(member.Permissions, GROUP_MEMBER_PERMISSIONS.SEND), value);
            await api(
                updateGroupMember(member.ID, {
                    GroupID: group.ID,
                    Permissions: newPermissions,
                })
            );
            dispatch(
                updateOverridePermissions({
                    groupID: group.ID,
                    memberID: member.ID,
                    newValue: newPermissions,
                })
            );
        } catch (error) {
            handleError(error);
        }
    };

    const handleSetGroupOwner = async () => {
        try {
            const newOwnerAddressID = member.AddressID;
            if (!newOwnerAddressID) {
                throw new Error('Member address ID not found');
            }
            await dispatch(
                addGroupOwnerThunk({ group, groupMemberID: member.ID, newOwnerAddressID, getMemberPublicKeys })
            );
        } catch (error) {
            handleError(error);
        }
    };

    const overrideGroupPermissions: GROUP_MEMBER_PERMISSIONS = hasBit(member.Permissions, GROUP_MEMBER_PERMISSIONS.SEND)
        ? GROUP_MEMBER_PERMISSIONS.SEND
        : GROUP_MEMBER_PERMISSIONS.NONE;

    const isPaused = member.State === GROUP_MEMBER_STATE.PAUSED;
    const isPending = member.State === GROUP_MEMBER_STATE.PENDING;
    const isRejected = member.State === GROUP_MEMBER_STATE.REJECTED;

    const canResendInvitation = isPending || isRejected;

    const sections: ReactNode[] = [
        // Use group sending permissions / Always allow sending
        canChangeVisibility && (
            <Fragment key="member-permission-options">
                {memberPermissionOptions.map((option) => (
                    <Option
                        key={option.value}
                        option={option}
                        isSelected={option.value === overrideGroupPermissions}
                        onSelect={handleOverrideGroupPermissions}
                        disabled={canOnlyDelete}
                    />
                ))}
            </Fragment>
        ),
        // Group owner
        isGroupOwnersEnabled && (
            <DropdownMenuButton
                key="group-owner"
                className="text-left flex justify-space-between items-center py-2 pb-3"
                onClick={handleSetGroupOwner}
                disabled={canOnlyDelete}
                liClassName="py-0"
            >
                <span className="flex items-center mr-14">{c('Action').t`Group owner`}</span>
                {isGroupOwner ? <Icon className="color-primary" name="checkmark" /> : null}
            </DropdownMenuButton>
        ),
        // Resume membership / Resend invitation / Revoke invitation
        <Fragment key="resume-resend-revoke-invitation">
            {isPaused && (
                <DropdownMenuButton
                    className="text-left py-2"
                    onClick={handleResumeInvitation}
                    disabled={canOnlyDelete}
                >
                    {c('Action').t`Resume membership`}
                </DropdownMenuButton>
            )}
            {canResendInvitation && (
                <DropdownMenuButton
                    className="text-left py-2"
                    onClick={handleResendInvitation}
                    disabled={canOnlyDelete}
                >
                    {c('Action').t`Resend invitation`}
                </DropdownMenuButton>
            )}
            <DropdownMenuButton
                className="text-left color-danger"
                onClick={handleRevokeInvitation}
                disabled={canOnlyDelete}
            >
                {c('Action').t`Revoke invitation`}
            </DropdownMenuButton>
        </Fragment>,
    ].filter(isTruthy);

    return (
        <>
            <Button
                shape="ghost"
                size="small"
                icon
                ref={anchorRef}
                onClick={() => {
                    toggle();
                }}
                title={c('Action').t`More options`}
                aria-expanded={isOpen}
            >
                <IcThreeDotsVertical alt={c('Action').t`More options`} />
            </Button>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="bottom-start"
                size={{ width: DropdownSizeUnit.Dynamic, maxWidth: DropdownSizeUnit.Viewport }}
            >
                <DropdownMenu>{jsxJoin(sections, <hr className="mt-2 mb-0" />)}</DropdownMenu>
            </Dropdown>
        </>
    );
};

export default GroupMemberItemDropdown;
