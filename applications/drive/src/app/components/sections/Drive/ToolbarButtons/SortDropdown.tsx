import { c } from 'ttag';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { DriveSectionSortKeys, SortParams } from '@proton/shared/lib/interfaces/drive/link';

import { useDriveContent } from '../DriveContentProvider';
import SortDropdown from '../../ToolbarButtons/SortDropdown';

const getMenuItems = (): {
    name: string;
    icon: string;
    sortParams: SortParams<DriveSectionSortKeys>;
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
        name: c('Action').t`Uploaded date: new to old`,
        icon: 'clock-rotate-right',
        sortParams: {
            // On API its called ModifyTime, but its actually time when
            // the last revision was uploaded. The real modify time is
            // stored in encrypted extended attributes.
            sortField: 'ModifyTime',
            sortOrder: SORT_DIRECTION.DESC,
        },
    },
    {
        name: c('Action').t`Uploaded date: old to new`,
        icon: 'clock-rotate-left',
        sortParams: {
            // See the comment above.
            sortField: 'ModifyTime',
            sortOrder: SORT_DIRECTION.ASC,
        },
    },
    {
        name: c('Action').t`Type: A to Z`,
        icon: 'arrow-up',
        sortParams: {
            sortField: 'MIMEType',
            sortOrder: SORT_DIRECTION.ASC,
        },
    },
    {
        name: c('Action').t`Type: Z to A`,
        icon: 'arrow-down',
        sortParams: {
            sortField: 'MIMEType',
            sortOrder: SORT_DIRECTION.DESC,
        },
    },
    {
        name: c('Action').t`Size: small to large`,
        icon: 'arrow-down-short-wide',
        sortParams: {
            sortField: 'Size',
            sortOrder: SORT_DIRECTION.ASC,
        },
    },
    {
        name: c('Action').t`Size: large to small`,
        icon: 'arrow-down-wide-short',
        sortParams: {
            sortField: 'Size',
            sortOrder: SORT_DIRECTION.DESC,
        },
    },
];

const SortDropdownDrive = () => {
    const { sortParams, setSorting } = useDriveContent();

    return <SortDropdown menuItems={getMenuItems()} sortParams={sortParams} setSorting={setSorting} />;
};

export default SortDropdownDrive;
