import { c } from 'ttag';

export const name = {
    type: 'name',
    getText: () => c('Label').t`Name`,
    props: {
        className: 'filebrowser-list-header-name-cell',
    },
};

export const modificationTimeDevice = {
    type: 'modificationTime',
    getText: () => c('Label').t`Modified`,
    props: {
        className: 'w-1/6',
    },
};

export default {
    name,
    modificationTimeDevice,
};
