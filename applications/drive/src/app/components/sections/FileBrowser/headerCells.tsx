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
        className: 'w20',
    },
};

export const trashed = {
    type: 'trashed',
    getText: () => c('Label').t`Deleted`,
    props: {
        className: 'w25',
    },
    sorting: true,
};

export const size = {
    type: 'size',
    getText: () => c('Label').t`Size`,
    props: {
        className: 'w10',
    },
    sorting: true,
};

export const modificationDate = {
    type: 'fileModifyTime',
    getText: () => c('Label').t`Modified`,
    props: {
        className: 'w15',
    },
    sorting: true,
};

export const creationDate = {
    type: 'linkCreateTime',
    getText: () => c('Label').t`Created`,
    props: {
        className: 'w15',
    },
    sorting: true,
};

export const accessCount = {
    type: 'numAccesses',
    getText: () => c('Label').t`# of accesses`,
    props: {
        className: 'w15',
    },
    sorting: true,
};

export const expirationDate = {
    type: 'linkExpireTime',
    getText: () => c('Label').t`Expires`,
    props: {
        className: 'w20',
    },
    sorting: true,
};

export const placeholder = {
    type: HeaderCellsPresets.Placeholder,
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
    expirationDate,
    accessCount,
};
