import { hasUnseenTracking } from '../../lib/interfaces';
import type { Folder } from '../../lib/interfaces/Folder';
import type { Label } from '../../lib/interfaces/Label';
import type { ContactGroup } from '../../lib/interfaces/contacts';

describe('hasUnseenTracking', () => {
    it('returns true for folders', () => {
        const folder: Folder = {
            ID: 'folder',
            Name: 'Folder',
            Color: '#000000',
            Path: '',
            Expanded: 0,
            Type: 3,
            Order: 0,
            Notify: 0,
            LastUnseenMessageEventID: null,
        };

        expect(hasUnseenTracking(folder)).toBe(true);
    });

    it('returns true for labels', () => {
        const label: Label = {
            ID: 'label',
            Name: 'Label',
            Color: '#000000',
            Type: 4,
            Order: 0,
            Path: '',
            LastUnseenMessageEventID: 12,
        };

        expect(hasUnseenTracking(label)).toBe(true);
    });

    it('returns false for contact groups', () => {
        const contactGroup: ContactGroup = {
            ID: 'contact-group',
            Name: 'Friends',
            Color: '#000000',
            Path: '',
            Display: 1,
            Exclusive: 0,
            Notify: 0,
            Order: 0,
            Type: 2,
        };

        expect(hasUnseenTracking(contactGroup)).toBe(false);
    });
});
