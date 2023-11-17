import React from 'react';

import { c } from 'ttag';

import { Info, TableCell } from '@proton/components/components';
import { vpnB2bAdminTooltipTitle } from '@proton/components/containers/members/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

import { UserManagementMode } from '../types';

type HeaderCellItem = {
    key: string;
    node: string | React.JSX.Element;
    className?: string;
    style?: React.CSSProperties;
};

const UsersAndAddressesSectionHeader = ({ mode }: { mode: UserManagementMode }) => {
    const roleCell: HeaderCellItem = {
        key: 'role',
        node: (
            <div className="flex gap-2 flex-flex-children items-center">
                <span>{c('Title header for members table').t`Role`}</span>
                <span className="hidden md:inline">
                    <Info
                        title={mode === UserManagementMode.VPN_B2B ? vpnB2bAdminTooltipTitle : undefined}
                        url={mode === UserManagementMode.DEFAULT ? getKnowledgeBaseUrl('/user-roles') : undefined}
                    />
                </span>
            </div>
        ),
        className: 'w-1/6',
    };
    const addressTitle =
        mode === UserManagementMode.VPN_B2B
            ? c('Title header for members table').t`Email`
            : c('Title header for members table').t`Addresses`;

    const headerCells: HeaderCellItem[] = [
        { key: 'name', node: c('Title header for members table').t`Name`, className: 'w-3/10' },
        mode === UserManagementMode.DEFAULT && roleCell,
        {
            key: 'addresses',
            node: (
                <>
                    <span className="text-ellipsis inline-block align-bottom max-w-full" title={addressTitle}>
                        {addressTitle}
                    </span>
                </>
            ),
            className: 'w-1/4',
        },
        mode === UserManagementMode.VPN_B2B && roleCell,
        mode === UserManagementMode.DEFAULT && {
            key: 'features',
            node: (
                <>
                    <span
                        className="text-ellipsis inline-block align-bottom max-w-full"
                        title={c('Title header for members table').t`Features`}
                    >{c('Title header for members table').t`Features`}</span>
                </>
            ),
            className: 'w-1/4',
        },
        { key: 'actions', node: '', className: 'w-1/6' },
    ].filter(isTruthy);

    return (
        <>
            {headerCells.map(({ key, node, className = '' }) => (
                <TableCell key={key} className={className} type="header">
                    {node}
                </TableCell>
            ))}
        </>
    );
};

export default UsersAndAddressesSectionHeader;
