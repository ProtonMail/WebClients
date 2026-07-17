import { getPaperTrailSectionIcon } from './getPaperTrailSectionIcon';

describe('getPaperTrailSectionIcon', () => {
    it('maps common section titles to icons', () => {
        expect(getPaperTrailSectionIcon('Name and identity')).toBe('User');
        expect(getPaperTrailSectionIcon('Work & Career')).toBe('Briefcase');
        expect(getPaperTrailSectionIcon('Education')).toBe('GraduationCap');
        expect(getPaperTrailSectionIcon('Health concerns')).toBe('HeartPulse');
        expect(getPaperTrailSectionIcon('Finances')).toBe('Wallet');
        expect(getPaperTrailSectionIcon('Politics')).toBe('Landmark');
        expect(getPaperTrailSectionIcon('Relationships & family')).toBe('Users');
        expect(getPaperTrailSectionIcon('Location signals')).toBe('MapPin');
        expect(getPaperTrailSectionIcon('Technical Expertise & Philosophy')).toBe('Brain');
        expect(getPaperTrailSectionIcon('Organizational Dynamics & Culture')).toBe('Network');
        expect(getPaperTrailSectionIcon('Communication Style & Preferences')).toBe('MessagesSquare');
    });

    it('falls back to a generic icon for unknown titles', () => {
        expect(getPaperTrailSectionIcon('Miscellaneous notes')).toBe('CircleDot');
    });
});
