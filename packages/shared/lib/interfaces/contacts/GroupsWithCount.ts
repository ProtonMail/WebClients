import type { ContactGroup } from './Contact';

export interface GroupsWithCount extends ContactGroup {
    count: number;
}
