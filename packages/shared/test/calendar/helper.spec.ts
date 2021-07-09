import { generateVeventHashUID, getSupportedUID } from '../../lib/calendar/helper';

describe('getSupportedUID', () => {
    it('should retain short UIDs', () => {
        const uidProperty = { value: 'stmyce9lb3ef@domain.com' };
        expect(getSupportedUID(uidProperty)).toEqual({
            value: 'stmyce9lb3ef@domain.com',
        });
    });

    it('should crop long UIDs', () => {
        const uidProperty = {
            value: '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890@domaine.com',
        };
        expect(getSupportedUID(uidProperty)).toEqual({
            value: '23456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890@domaine.com',
        });
    });
});

describe('getVeventHashUID', () => {
    const binaryString = 'some random words for the test';
    const shortUid = 'stmyce9lb3ef@domain.com';
    const longUid =
        '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890@domaine.com';

    it('should generate new UIDs', async () => {
        expect(await generateVeventHashUID(binaryString)).toEqual('sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229');
    });

    it('should keep short UIDs after the hash', async () => {
        expect(await generateVeventHashUID(binaryString, shortUid)).toEqual(
            'sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229-original-uid-stmyce9lb3ef@domain.com'
        );
    });

    it('should keep short UIDs after the hash', async () => {
        expect(await generateVeventHashUID(binaryString, longUid)).toEqual(
            'sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229-original-uid-56789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890@domaine.com'
        );
    });
});
