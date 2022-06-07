import { c } from 'ttag';
import { HeaderCellsPresets } from '../../FileBrowser/interface';

export const checkbox = {
    type: HeaderCellsPresets.Checkbox,
};

export const name = {
    type: 'name',
    text: c('Label').t`Name`,
    sorting: true,
};

export const location = {
    type: 'location',
    text: c('Label').t`Location`,
    props: {
        className: 'w20',
    },
};

export const trashed = {
    type: 'trashed',
    text: c('Label').t`Deleted`,
    props: {
        className: 'w25',
    },
    sorting: true,
};

export const size = {
    type: 'size',
    text: c('Label').t`Size`,
    props: {
        className: 'w10',
    },
    sorting: true,
};

export const modificationDate = {
    type: 'fileModifyTime',
    text: c('Label').t`Modified`,
    props: {
        className: 'w15',
    },
    sorting: true,
};

export const creationDate = {
    type: 'linkCreateTime',
    text: c('Label').t`Created`,
    props: {
        className: 'w15',
    },
    sorting: true,
};

export const accessCount = {
    type: 'numAccesses',
    text: c('Label').t`# of accesses`,
    props: {
        className: 'w15',
    },
    sorting: true,
};

export const expirationDate = {
    type: 'linkExpireTime',
    text: c('Label').t`Expires`,
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
