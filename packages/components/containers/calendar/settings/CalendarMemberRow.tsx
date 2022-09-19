import { useState } from 'react';

import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar';
import { Button, Icon, Option, SelectTwo, Tooltip } from '@proton/components/components';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { useLoading } from '@proton/components/hooks';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { MEMBER_INVITATION_STATUS } from '@proton/shared/lib/interfaces/calendar';

import './CalendarMemberGrid.scss';

interface CalendarMemberRowProps {
    email: string;
    name: string;
    deleteLabel: string;
    permissions: number;
    status?: MEMBER_INVITATION_STATUS;
    onPermissionsUpdate: (newPermissions: number) => Promise<void>;
    onDelete: () => Promise<void>;
}

const permissionLabelMap = {
    // [CalendarMemberPermissions.EDIT]: c('Calendar share permission label').t`Edit`,
    [MEMBER_PERMISSIONS.FULL_VIEW]: c('Calendar share permission label').t`See all event details`,
    // [CalendarMemberPermissions.LIMITED]: c('Calendar share permission label').t`See only free/busy`,
};

export const MemberStatus = ({ children }: { children: string }) => (
    <span className="calendar-member-status inline-flex text-sm text-semibold color-weak bg-strong text-uppercase rounded text-no-wrap">
        {children}
    </span>
);

const CalendarMemberRow = ({
    onPermissionsUpdate,
    email,
    name,
    deleteLabel,
    permissions,
    onDelete,
    status,
}: CalendarMemberRowProps) => {
    const [isLoadingDelete, withLoadingDelete] = useLoading();
    const [isLoadingPermissionsUpdate, withLoadingPermissionsUpdate] = useLoading();

    const [perms, setPerms] = useState(permissions);

    const handleDelete = () => withLoadingDelete(onDelete());
    const handleChangePermissions = async ({ value: newPermissions }: SelectChangeEvent<number>) => {
        await withLoadingPermissionsUpdate(onPermissionsUpdate(newPermissions));
        setPerms(newPermissions);
    };

    const isStatusRejected = status === MEMBER_INVITATION_STATUS.REJECTED;

    const getStatusLabel = () => {
        if (status === MEMBER_INVITATION_STATUS.PENDING) {
            return (
                <div>
                    <MemberStatus>{c('Calendar invite status label').t`Invite sent`}</MemberStatus>
                </div>
            );
        }

        if (isStatusRejected) {
            return (
                <div>
                    <MemberStatus>{c('Calendar invite status label').t`Declined`}</MemberStatus>
                </div>
            );
        }

        return null;
    };

    return (
        <>
            <div>
                <Avatar className="avatar--weak">{getInitials(name)}</Avatar>
            </div>
            <div>
                <div className="text-ellipsis" title={name}>
                    {name}
                </div>
                {email !== name && (
                    <div className="text-ellipsis text-sm m0 color-weak" title={email}>
                        {email}
                    </div>
                )}
            </div>
            <div>
                {!isStatusRejected && (
                    <SelectTwo loading={isLoadingPermissionsUpdate} value={perms} onChange={handleChangePermissions}>
                        {Object.entries(permissionLabelMap).map(([value, label]) => (
                            <Option key={value} value={+value} title={label} />
                        ))}
                    </SelectTwo>
                )}
            </div>
            <div>{getStatusLabel()}</div>
            <div>
                <div className="flex">
                    <Tooltip title={deleteLabel}>
                        <Button
                            icon
                            shape="ghost"
                            loading={isLoadingDelete}
                            onClick={handleDelete}
                            className="flex-item-noshrink"
                        >
                            <Icon name="trash" alt={deleteLabel} />
                        </Button>
                    </Tooltip>
                </div>
            </div>
        </>
    );
};

export default CalendarMemberRow;
