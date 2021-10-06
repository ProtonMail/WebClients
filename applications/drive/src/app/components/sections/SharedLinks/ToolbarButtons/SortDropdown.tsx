import { c } from 'ttag';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { SharedLinksSectionSortKeys, SortParams } from '@proton/shared/lib/interfaces/drive/link';

import SortDropdown from '../../ToolbarButtons/SortDropdown';
import { useSharedLinksContent } from '../SharedLinksContentProvider';

const menuItems = (): {
    name: string;
    icon: string;
    sortParams: SortParams<SharedLinksSectionSortKeys>;
}[] => [
    {
        name: c('Action').t`Name: A to Z`,
        icon: 'arrow-up',
        sortParams: {
            sortField: 'Name',
            sortOrder: SORT_DIRECTION.ASC,
        },
    },
    {
        name: c('Action').t`Name: Z to A`,
        icon: 'arrow-down',
        sortParams: {
            sortField: 'Name',
            sortOrder: SORT_DIRECTION.DESC,
        },
    },
    {
        name: c('Action').t`Created date: new to old`,
        icon: 'clock-rotate-right',
        sortParams: {
            sortField: 'CreateTime',
            sortOrder: SORT_DIRECTION.DESC,
        },
    },
    {
        name: c('Action').t`Created date: old to new`,
        icon: 'clock-rotate-left',
        sortParams: {
            sortField: 'CreateTime',
            sortOrder: SORT_DIRECTION.ASC,
        },
    },
    {
        name: c('Action').t`Expires: new to old`,
        icon: 'clock-rotate-right',
        sortParams: {
            sortField: 'ExpireTime',
            sortOrder: SORT_DIRECTION.DESC,
        },
    },
    {
        name: c('Action').t`Expires: old to new`,
        icon: 'clock-rotate-left',
        sortParams: {
            sortField: 'ExpireTime',
            sortOrder: SORT_DIRECTION.ASC,
        },
    },
];

const SortDropdownLinks = () => {
    const { sortParams, setSorting } = useSharedLinksContent();

    return <SortDropdown menuItems={menuItems()} sortParams={sortParams} setSorting={setSorting} />;
};

export default SortDropdownLinks;
