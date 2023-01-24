import { useState } from 'react';

import { c } from 'ttag';

import { Avatar, Button } from '@proton/atoms';
import { Icon, Option, SelectTwo, Tooltip } from '@proton/components/components';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { useLoading } from '@proton/components/hooks';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { MEMBER_INVITATION_STATUS } from '@proton/shared/lib/interfaces/calendar';

import { TableCell, TableRow } from '../../../components';

import './CalendarMemberGrid.scss';

const permissionLabelMap = {
    // [CalendarMemberPermissions.EDIT]: c('Calendar share permission label').t`Edit`,
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
            <TableCell className="on-mobile-pl0">
                <div className="flex flex-nowrap flex-align-items-center flex-gap-0-5 on-mobile-w40">
                    <Avatar className="avatar--weak flex-item-noshrink">{getInitials(name)}</Avatar>

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
                        loading={isLoadingDelete}
                        onClick={handleDelete}
                        className="mlauto no-mobile no-tablet"
                    >
                        <Icon name="trash" alt={deleteLabel} />
                    </Button>
                </Tooltip>
                <Button
                    shape="outline"
                    size="small"
                    loading={isLoadingDelete}
                    onClick={handleDelete}
                    className="no-desktop"
                >
                    {deleteLabel}
                </Button>
            </TableCell>
        </TableRow>
    );
};

export default CalendarMemberRow;
