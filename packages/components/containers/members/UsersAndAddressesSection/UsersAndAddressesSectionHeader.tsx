import type { CSSProperties, JSX } from 'react';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import TableCell from '@proton/components/components/table/TableCell';
import { adminTooltipText } from '@proton/components/containers/members/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

type HeaderCellItem = {
    key: string;
    node: string | JSX.Element;
    className?: string;
    style?: CSSProperties;
};

interface Props {
    useEmail?: boolean;
    showFeaturesColumn?: boolean;
}

const UsersAndAddressesSectionHeader = ({ useEmail, showFeaturesColumn }: Props) => {
    const addressesTitle = useEmail
        ? c('Title header for members table').t`Email`
        : c('Title header for members table').t`Addresses`;

    const headerCells: HeaderCellItem[] = [
        { key: 'name', node: c('Title header for members table').t`Name`, className: 'w-3/10' },
        {
            key: 'role',
            node: (
                <div className="flex gap-2 flex *:flex items-center">
                    <span>{c('Title header for members table').t`Role`}</span>
                    <span className="hidden md:inline">
                        <Info title={adminTooltipText()} url={getKnowledgeBaseUrl('/user-roles')} />
                    </span>
                </div>
            ),
            className: 'w-1/6',
        },
        {
            key: 'addresses',
            node: (
                <>
                    <span className="text-ellipsis inline-block align-bottom max-w-full" title={addressesTitle}>
                        {addressesTitle}
                    </span>
                </>
            ),
            className: 'w-1/4',
        },
        showFeaturesColumn && {
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
