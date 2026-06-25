import type { Folder } from './Folder';
import type { Label } from './Label';
import type { ContactGroup } from './contacts';

export type Category = Folder | Label | ContactGroup;

export const hasUnseenTracking = (category: Category): category is Folder | Label => {
    return 'LastUnseenMessageEventID' in category;
};
