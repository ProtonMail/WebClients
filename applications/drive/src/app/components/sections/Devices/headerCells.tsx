import { c } from 'ttag';

export const name = {
    type: 'name',
    text: c('Label').t`Name`,
    props: {
        className: 'filebrowser-list-header-name-cell',
    },
};

export const modificationTimeDevice = {
    type: 'modificationTime',
    text: c('Label').t`Modified`,
    props: {
        className: 'w15',
    },
};

export default {
    name,
    modificationTimeDevice,
};
