import { c } from 'ttag';

import { HeaderCellsPresets } from '../../FileBrowser/interface';

export const checkbox = {
    type: HeaderCellsPresets.Checkbox,
};

export const name = {
    type: 'name',
    getText: () => c('Label').t`Name`,
    sorting: true,
};

export const location = {
    type: 'location',
    getText: () => c('Label').t`Location`,
    props: {
        className: 'w-1/5',
    },
};

export const trashed = {
    type: 'trashed',
    getText: () => c('Label').t`Deleted`,
    props: {
        className: 'w-1/4',
    },
    sorting: true,
};

export const size = {
    type: 'size',
    getText: () => c('Label').t`Size`,
    props: {
        className: 'w-1/10',
    },
    sorting: true,
};

export const modificationDate = {
    type: 'fileModifyTime',
    getText: () => c('Label').t`Modified`,
    props: {
        className: 'w-1/6',
    },
    sorting: true,
};

export const creationDate = {
    type: 'linkCreateTime',
    getText: () => c('Label').t`Created`,
    props: {
        className: 'w-1/6',
    },
    sorting: true,
};

export const sharedOnDate = {
    type: 'sharedOn',
    getText: () => c('Label').t`Shared on`,
    props: {
        className: 'w-1/6',
    },
    sorting: true,
};

export const sharedBy = {
    type: 'sharedBy',
    getText: () => c('Label').t`Shared by`,
    props: {
        className: 'w-1/5',
    },
    sorting: true,
};

export const accessCount = {
    type: 'numAccesses',
    getText: () => c('Label').t`# of downloads`,
    props: {
        className: 'w-1/6',
    },
    sorting: true,
};

export const expirationDate = {
    type: 'linkExpireTime',
    getText: () => c('Label').t`Expires`,
    props: {
        className: 'w-1/5',
    },
    sorting: true,
};

export const placeholder = {
    type: HeaderCellsPresets.Placeholder,
    props: {
        className: 'file-browser-list--context-menu-column',
    },
};

export default {
    checkbox,
    location,
    modificationDate,
    name,
    placeholder,
    size,
    trashed,
    creationDate,
    sharedOnDate,
    sharedBy,
    expirationDate,
    accessCount,
};
