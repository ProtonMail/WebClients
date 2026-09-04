import { getLumoScopedStorageKey } from './lumoScopedLocalStorage';
import {
    hasDismissedApertusAnnouncement,
    markApertusAnnouncementDismissed,
} from './apertusAnnouncementStorage';

const APERTUS_ANNOUNCEMENT_KEY = 'lumo-apertus-announcement';

describe('apertusAnnouncementStorage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('is not dismissed by default', () => {
        expect(hasDismissedApertusAnnouncement()).toBe(false);
    });

    it('persists dismissal in scoped local storage', () => {
        markApertusAnnouncementDismissed();

        expect(hasDismissedApertusAnnouncement()).toBe(true);
        expect(localStorage.getItem(getLumoScopedStorageKey(APERTUS_ANNOUNCEMENT_KEY))).toContain('"dismissed":true');
    });

    it('ignores malformed stored data', () => {
        localStorage.setItem(getLumoScopedStorageKey(APERTUS_ANNOUNCEMENT_KEY), '{');

        expect(hasDismissedApertusAnnouncement()).toBe(false);
    });
});
