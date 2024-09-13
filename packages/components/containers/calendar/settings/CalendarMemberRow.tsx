import { useState } from 'react';

import { c } from 'ttag';

import { Avatar, Button } from '@proton/atoms';
import { Option, SelectTwo, Tooltip } from '@proton/components/components';
import Icon from '@proton/components/components/icon/Icon';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { useLoading } from '@proton/hooks';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { MEMBER_INVITATION_STATUS } from '@proton/shared/lib/interfaces/calendar';

import { TableCell, TableRow } from '../../../components';

import './CalendarMemberGrid.scss';

const permissionLabelMap = {
    [MEMBER_PERMISSIONS.EDIT]: c('Calendar share permission label').t`Edit event details`,
    [MEMBER_PERMISSIONS.FULL_VIEW]: c('Calendar share permission label').t`See all event details`,
    // [CalendarMemberPermissions.LIMITED]: c('Calendar share permission label').t`See only free/busy`,
};

const getStatusText = (status: MEMBER_INVITATION_STATUS) => {
    if (status === MEMBER_INVITATION_STATUS.PENDING) {
        return c('Calendar invite status label').t`Invite sent`;
    }

    if (status === MEMBER_INVITATION_STATUS.REJECTED) {
        return c('Calendar invite status label').t`Declined`;
    }

    return '';
};

export const MemberStatus = ({ status }: { status: MEMBER_INVITATION_STATUS }) => {
    if (status === MEMBER_INVITATION_STATUS.ACCEPTED) {
        return null;
    }

    const text = getStatusText(status);

    return (
        <span
            title={text}
            className="calendar-member-status inline-block text-ellipsis text-sm text-semibold color-weak bg-strong text-uppercase rounded text-no-wrap"
        >
            {text}
        </span>
    );
};

interface CalendarMemberRowProps {
    email: string;
    name: string;
    deleteLabel: string;
    permissions: number;
    status: MEMBER_INVITATION_STATUS;
    displayPermissions: boolean;
    displayStatus: boolean;
    canEdit: boolean;
    onPermissionsUpdate: (newPermissions: number) => Promise<void>;
    onDelete: () => Promise<void>;
}

const CalendarMemberRow = ({
    email,
    name,
    deleteLabel,
    permissions,
    status,
    displayPermissions,
    displayStatus,
    canEdit,
    onPermissionsUpdate,
    onDelete,
}: CalendarMemberRowProps) => {
    const [isLoadingDelete, withLoadingDelete] = useLoading();
    const [isLoadingPermissionsUpdate, withLoadingPermissionsUpdate] = useLoading();

    const [perms, setPerms] = useState(permissions);

    const handleDelete = () => withLoadingDelete(onDelete());
    const handleChangePermissions = async ({ value: newPermissions }: SelectChangeEvent<number>) => {
        await withLoadingPermissionsUpdate(onPermissionsUpdate(newPermissions));
        setPerms(newPermissions);
    };

    const availablePermissions = Object.entries(permissionLabelMap);
    const isStatusRejected = status === MEMBER_INVITATION_STATUS.REJECTED;

    const permissionsSelect = (
        <SelectTwo
            loading={isLoadingPermissionsUpdate}
            value={perms}
            disabled={!canEdit}
            onChange={handleChangePermissions}
        >
            {availablePermissions.map(([value, label]) => (
                <Option key={value} value={+value} title={label} />
            ))}
        </SelectTwo>
    );

    return (
        <TableRow>
            <TableCell>
                <div className="flex flex-nowrap items-center gap-2 w-full md:w-auto">
                    <Avatar color="weak" className="shrink-0">
                        {getInitials(name)}
                    </Avatar>

                    <div>
                        <div className="text-ellipsis" title={name}>
                            {name}
                        </div>
                        {email !== name && (
                            <div className="text-ellipsis text-sm m-0 color-weak" title={email}>
                                {email}
                            </div>
                        )}
                    </div>
                </div>
            </TableCell>
            {displayPermissions && (
                <TableCell label={c('Header').t`Permissions`}>{!isStatusRejected && permissionsSelect}</TableCell>
            )}
            {displayStatus && (
                <TableCell>
                    <MemberStatus status={status} />
                </TableCell>
            )}
            <TableCell>
                <Tooltip title={deleteLabel}>
                    <Button
                        icon
                        shape="ghost"
                        color="norm"
                        loading={isLoadingDelete}
                        onClick={handleDelete}
                        className="ml-auto hidden lg:inline-block"
                    >
                        <Icon name="trash" alt={deleteLabel} />
                    </Button>
                </Tooltip>
                <div className="lg:hidden">
                    <Button
                        shape="outline"
                        color="norm"
                        size="small"
                        loading={isLoadingDelete}
                        onClick={handleDelete}
                        className="inline-flex items-center flex-nowrap"
                    >
                        <Icon name="trash" alt="" className="mr-1 shrink-0" />
                        <span>{deleteLabel}</span>
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};

export default CalendarMemberRow;
