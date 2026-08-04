import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';

export const buildFolder = (value?: Partial<Folder>): Folder => {
    return {
        ID: 'folder-id',
        Name: 'Folder',
        Color: '#c44800',
        Path: 'Folder',
        Expanded: 0,
        Type: LABEL_TYPE.MESSAGE_FOLDER,
        Order: 1,
        ParentID: undefined,
        Notify: 1,
        LastUnseenMessageEventID: null,
        ...value,
    };
};
