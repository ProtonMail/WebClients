import { SharedURLFlags } from '../interfaces/sharing';
import {
    splitGeneratedAndCustomPassword,
    adjustName,
    splitLinkName,
    hasCustomPassword,
    hasGeneratedPasswordIncluded,
    hasNoCustomPassword,
} from './link';

describe('Password flags checks', () => {
    describe('Missing data check', () => {
        it('returns false if flags are undefined', () => {
            expect(hasCustomPassword({})).toEqual(false);
            expect(hasGeneratedPasswordIncluded({})).toEqual(false);
        });
        it('returns false if SharedURLInfo is abscent', () => {
            expect(hasCustomPassword()).toEqual(false);
            expect(hasGeneratedPasswordIncluded()).toEqual(false);
        });
    });

    describe('hasCustomPassword', () => {
        it('returns true is CustomPassword flag is present', () => {
            expect(hasCustomPassword({ Flags: 0 | SharedURLFlags.CustomPassword })).toEqual(true);
            expect(
                hasCustomPassword({ Flags: SharedURLFlags.GeneratedPasswordIncluded | SharedURLFlags.CustomPassword })
            ).toEqual(true);
            expect(hasCustomPassword({ Flags: 0 })).toEqual(false);
        });
    });

    describe('hasGeneratedPasswordIncluded', () => {
        it('returns true is CustomPassword flag is present', () => {
            expect(hasGeneratedPasswordIncluded({ Flags: 0 | SharedURLFlags.GeneratedPasswordIncluded })).toEqual(true);
            expect(
                hasGeneratedPasswordIncluded({
                    Flags: SharedURLFlags.GeneratedPasswordIncluded | SharedURLFlags.CustomPassword,
                })
            ).toEqual(true);
            expect(hasGeneratedPasswordIncluded({ Flags: 0 })).toEqual(false);
        });
    });

    describe('hasNoCustomPassword', () => {
        it('returns true is CustomPassword flag is present', () => {
            expect(hasNoCustomPassword({ Flags: 0 | 4 })).toEqual(true);
            expect(hasNoCustomPassword({ Flags: 0 })).toEqual(true);
            expect(hasNoCustomPassword({ Flags: SharedURLFlags.CustomPassword })).toEqual(false);
            expect(hasNoCustomPassword({ Flags: SharedURLFlags.GeneratedPasswordIncluded }));
        });
        it('returns true if SharedURLInfo is abscent', () => {
            expect(hasNoCustomPassword()).toEqual(true);
        });
        it('returns true if flags are undefined', () => {
            expect(hasNoCustomPassword({})).toEqual(true);
        });
    });
});

describe('splitGeneratedAndCustomPassword', () => {
    it('no custom password returns only generated password', () => {
        expect(splitGeneratedAndCustomPassword('1234567890ab', { Flags: 0 })).toEqual(['1234567890ab', '']);
    });

    it('legacy custom password returns only custom password', () => {
        expect(splitGeneratedAndCustomPassword('abc', { Flags: SharedURLFlags.CustomPassword })).toEqual(['', 'abc']);
    });

    it('new custom password returns both generated and custom password', () => {
        expect(
            splitGeneratedAndCustomPassword('1234567890ababc', {
                Flags: SharedURLFlags.CustomPassword | SharedURLFlags.GeneratedPasswordIncluded,
            })
        ).toEqual(['1234567890ab', 'abc']);
    });
});

describe('adjustName', () => {
    it('should add index to a file with extension', () => {
        expect(adjustName(3, 'filename', 'ext')).toBe('filename (3).ext');
    });

    it('should add index to a file without extension', () => {
        expect(adjustName(3, 'filename')).toBe('filename (3)');
        expect(adjustName(3, 'filename', '')).toBe('filename (3)');
        expect(adjustName(3, 'filename.')).toBe('filename. (3)');
        expect(adjustName(3, '.filename.')).toBe('.filename. (3)');
    });

    it('should add index to a file without name', () => {
        expect(adjustName(3, '', 'ext')).toBe('.ext (3)');
    });

    it('should leave zero-index filename with extension unchanged', () => {
        expect(adjustName(0, 'filename', 'ext')).toBe('filename.ext');
    });

    it('should leave zero-index filename without extension unchanged', () => {
        expect(adjustName(0, 'filename')).toBe('filename');
        expect(adjustName(0, 'filename', '')).toBe('filename');
        expect(adjustName(0, 'filename.')).toBe('filename.');
        expect(adjustName(0, '.filename.')).toBe('.filename.');
    });

    it('should leave zero-index filename without name unchanged', () => {
        expect(adjustName(0, '', 'ext')).toBe('.ext');
    });
});

describe('splitLinkName', () => {
    it('should split file name and extension', () => {
        expect(splitLinkName('filename.ext')).toEqual(['filename', 'ext']);
    });

    it('should split file name without extension', () => {
        expect(splitLinkName('filename')).toEqual(['filename', '']);
        expect(splitLinkName('filename.')).toEqual(['filename.', '']);
    });

    it('should split file name without name', () => {
        expect(splitLinkName('.ext')).toEqual(['', 'ext']);
    });
});
