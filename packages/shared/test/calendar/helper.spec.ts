import { MAX_LENGTHS } from '../../lib/calendar/constants';
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
        'Cm5XpErjCp4syBD1zI0whscVHuQklN3tvXxxXpaewdBGEpOFTcMCqM8WDLLYDM6kuXAqdTqL1y98SRrf5thkyceT01boWtEeCkrep75kRiKnHE5YnBKYvEFmcWKJ0q0eeNWIN4OLZ8yJnSDdC8DT9CndSxOnnPC47VWjQHu0psXB25lZuCt4EWsWAtgmCPWe1Wa0AIL0y8rlPn0qbB05u3WuyOst8XYkJNWz6gYx@domaine.com';

    it('should generate new UIDs', async () => {
        expect(await generateVeventHashUID(binaryString)).toEqual('sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229');
    });

    it('should keep short UIDs after the hash', async () => {
        expect(await generateVeventHashUID(binaryString, shortUid)).toEqual(
            'sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229-original-uid-stmyce9lb3ef@domain.com'
        );
    });

    it('should crop long UIDs after the hash', async () => {
        const hashUID = await generateVeventHashUID(binaryString, longUid);
        expect(hashUID.length).toEqual(MAX_LENGTHS.UID);
        expect(hashUID).toEqual(
            'sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229-original-uid-vEFmcWKJ0q0eeNWIN4OLZ8yJnSDdC8DT9CndSxOnnPC47VWjQHu0psXB25lZuCt4EWsWAtgmCPWe1Wa0AIL0y8rlPn0qbB05u3WuyOst8XYkJNWz6gYx@domaine.com'
        );
    });
});
