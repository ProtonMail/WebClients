import { SharedURLFlags } from '@proton/shared/lib/interfaces/drive/sharing';
import {
    splitGeneratedAndCustomPassword,
    hasCustomPassword,
    hasGeneratedPasswordIncluded,
    hasNoCustomPassword,
} from './shareUrl';

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
