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
        className: 'w-custom',
        style: { '--w-custom': '15%' },
    },
};

export default {
    name,
    modificationTimeDevice,
};
