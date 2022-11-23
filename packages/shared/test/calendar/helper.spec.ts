import { MAX_LENGTHS_API } from '../../lib/calendar/constants';
import { generateVeventHashUID, getOriginalUID, getSupportedUID } from '../../lib/calendar/helper';

describe('getSupportedUID', () => {
    it('should retain short UIDs', () => {
        const uid = 'stmyce9lb3ef@domain.com';
        expect(getSupportedUID(uid)).toEqual(uid);
    });

    it('should crop long UIDs', () => {
        const uid =
            '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890@domaine.com';
        expect(getSupportedUID(uid)).toEqual(
            '23456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890@domaine.com'
        );
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

    it('should keep short UIDs before the hash', async () => {
        expect(await generateVeventHashUID(binaryString, shortUid)).toEqual(
            'original-uid-stmyce9lb3ef@domain.com-sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229'
        );
    });

    it('should crop long UIDs before the hash', async () => {
        const hashUID = await generateVeventHashUID(binaryString, longUid);
        expect(hashUID.length).toEqual(MAX_LENGTHS_API.UID);
        expect(hashUID).toEqual(
            'original-uid-vEFmcWKJ0q0eeNWIN4OLZ8yJnSDdC8DT9CndSxOnnPC47VWjQHu0psXB25lZuCt4EWsWAtgmCPWe1Wa0AIL0y8rlPn0qbB05u3WuyOst8XYkJNWz6gYx@domaine.com-sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229'
        );
    });
});

describe('getOriginalUID', () => {
    const binaryString = 'some random words for the test';
    const shortUid = 'stmyce9lb3ef@domain.com';
    const longUid =
        'Cm5XpErjCp4syBD1zI0whscVHuQklN3tvXxxXpaewdBGEpOFTcMCqM8WDLLYDM6kuXAqdTqL1y98SRrf5thkyceT01boWtEeCkrep75kRiKnHE5YnBKYvEFmcWKJ0q0eeNWIN4OLZ8yJnSDdC8DT9CndSxOnnPC47VWjQHu0psXB25lZuCt4EWsWAtgmCPWe1Wa0AIL0y8rlPn0qbB05u3WuyOst8XYkJNWz6gYx@domaine.com';
    const longUidLength = longUid.length;

    it('should return the empty string if passed nothing', () => {
        expect(getOriginalUID()).toEqual('');
    });

    it('should retrieve the original short UIDs after the hash operation', async () => {
        expect(getOriginalUID(await generateVeventHashUID(binaryString, shortUid))).toEqual(shortUid);
    });

    it('should retrieve no UID after the hash operation if there was none before', async () => {
        expect(getOriginalUID(await generateVeventHashUID(binaryString))).toEqual('');
    });

    it('should retrieve a cropped version of long UIDs after the hash operation', async () => {
        expect(getOriginalUID(await generateVeventHashUID(binaryString, longUid))).toEqual(
            longUid.substring(longUidLength - 128, longUidLength)
        );
    });

    it('should return the uid if it is not a hash', async () => {
        expect(getOriginalUID('random-uid')).toEqual('random-uid');
    });
});
