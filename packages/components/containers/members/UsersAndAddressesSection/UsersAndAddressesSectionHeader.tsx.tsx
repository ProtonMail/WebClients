import { c } from 'ttag';

import { Info, TableCell } from '@proton/components/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

type HeaderCellItem = {
    key: string;
    node: string | JSX.Element;
    className?: string;
};

const UsersAndAddressesSectionHeader = () => {
    const headerCells: HeaderCellItem[] = [
        { key: 'name', node: c('Title header for members table').t`Name`, className: 'w30' },
        {
            key: 'role',
            node: (
                <div className="flex flex-gap-0-5 flex-flex-children">
                    <span>{c('Title header for members table').t`Role`}</span>
                    <span className="no-mobile">
                        <Info url={getKnowledgeBaseUrl('/user-roles')} />
                    </span>
                </div>
            ),
            className: 'w15',
        },
        {
            key: 'addresses',
            node: (
                <>
                    <span
                        className="text-ellipsis inline-block align-bottom max-w100"
                        title={c('Title header for members table').t`Addresses`}
                    >{c('Title header for members table').t`Addresses`}</span>
                </>
            ),
            className: 'w25',
        },
        {
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
    ];

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
