import { FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';

import { UnreadCounts } from '../components/sidebar/MailSidebarList';
import { getUnreadCount } from './sidebar';

const EXPANDED = 1;
const COLLAPSED = 0;

describe('getUnreadCount', () => {
    const counterMap = { A: 3, B: 1, C: 2, D: 0 } as UnreadCounts;
    const folder = {
        ID: 'A',
        Expanded: EXPANDED,
        subfolders: [
            {
                ID: 'B',
                Expanded: EXPANDED,
                subfolders: [
                    {
                        ID: 'C',
                        Expanded: EXPANDED,
                        subfolders: [
                            {
                                ID: 'D',
                                Expanded: EXPANDED,
                            } as FolderWithSubFolders,
                        ],
                    } as FolderWithSubFolders,
                ],
            } as FolderWithSubFolders,
        ],
    } as FolderWithSubFolders;

    it('should accumulate unread total when collapsed', () => {
        expect(getUnreadCount(counterMap, { ...folder, Expanded: COLLAPSED })).toEqual(6);
    });

    it('should display display individual unreal total', () => {
        expect(getUnreadCount(counterMap, folder)).toEqual(3);
    });
});
