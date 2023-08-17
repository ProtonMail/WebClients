import { c } from 'ttag';

import { Info, TableCell } from '@proton/components/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

import { UserManagementMode } from '../types';

type HeaderCellItem = {
    key: string;
    node: string | React.JSX.Element;
    className?: string;
};

const UsersAndAddressesSectionHeader = ({ mode }: { mode: UserManagementMode }) => {
    const roleCell: HeaderCellItem = {
        key: 'role',
        node: (
            <div className="flex gap-2 flex-flex-children flex-align-items-center">
                <span>{c('Title header for members table').t`Role`}</span>
                <span className="no-mobile">
                    <Info url={getKnowledgeBaseUrl('/user-roles')} />
                </span>
            </div>
        ),
        className: 'w15',
    };
    const addressTitle =
        mode === UserManagementMode.VPN_B2B
            ? c('Title header for members table').t`Email`
            : c('Title header for members table').t`Addresses`;

    const headerCells: HeaderCellItem[] = [
        { key: 'name', node: c('Title header for members table').t`Name`, className: 'w30' },
        mode === UserManagementMode.DEFAULT && roleCell,
        {
            key: 'addresses',
            node: (
                <>
                    <span className="text-ellipsis inline-block align-bottom max-w100" title={addressTitle}>
                        {addressTitle}
                    </span>
                </>
            ),
            className: 'w25',
        },
        mode === UserManagementMode.VPN_B2B && roleCell,
        mode === UserManagementMode.DEFAULT && {
            key: 'features',
            node: (
                <>
                    <span
                        className="text-ellipsis inline-block align-bottom max-w100"
                        title={c('Title header for members table').t`Features`}
                    >{c('Title header for members table').t`Features`}</span>
                </>
            ),
            className: 'w25',
        },
        { key: 'actions', node: '', className: 'w15' },
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
