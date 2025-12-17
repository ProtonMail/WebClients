import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { MAX_CHARS_API } from '../../lib/calendar/constants';
import {
    generateVeventHashUID,
    getHasLegacyHashUID,
    getNaiveDomainFromUID,
    getOriginalUID,
    getSupportedUID,
} from '../../lib/calendar/helper';

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
    const bytes = stringToUint8Array('some random words for the test');
    const shortUid = 'stmyce9lb3ef@domain.com';
    const longUid =
        'Cm5XpErjCp4syBD1zI0whscVHuQklN3tvXxxXpaewdBGEpOFTcMCqM8WDLLYDM6kuXAqdTqL1y98SRrf5thkyceT01boWtEeCkrep75kRiKnHE5YnBKYvEFmcWKJ0q0eeNWIN4OLZ8yJnSDdC8DT9CndSxOnnPC47VWjQHu0psXB25lZuCt4EWsWAtgmCPWe1Wa0AIL0y8rlPn0qbB05u3WuyOst8XYkJNWz6gYx@domaine.com';

    it('should generate new UIDs', async () => {
        expect(await generateVeventHashUID(bytes)).toEqual('sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229');
    });

    it('should generate the same UID with or without legacy format', async () => {
        expect(await generateVeventHashUID(bytes)).toEqual(await generateVeventHashUID(bytes, '', true));
    });

    it('should keep short UIDs before the hash', async () => {
        expect(await generateVeventHashUID(bytes, shortUid)).toEqual(
            'original-uid-stmyce9lb3ef@domain.com-sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229'
        );
    });

    it('should crop long UIDs before the hash', async () => {
        const hashUID = await generateVeventHashUID(bytes, longUid);
        expect(hashUID.length).toEqual(MAX_CHARS_API.UID);
        expect(hashUID).toEqual(
            'original-uid-vEFmcWKJ0q0eeNWIN4OLZ8yJnSDdC8DT9CndSxOnnPC47VWjQHu0psXB25lZuCt4EWsWAtgmCPWe1Wa0AIL0y8rlPn0qbB05u3WuyOst8XYkJNWz6gYx@domaine.com-sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229'
        );
    });

    it('should keep short UIDs after the hash when using legacy format', async () => {
        expect(await generateVeventHashUID(bytes, shortUid, true)).toEqual(
            'sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229-original-uid-stmyce9lb3ef@domain.com'
        );
    });

    it('should crop long UIDs after the hash when using legacy format', async () => {
        const hashUID = await generateVeventHashUID(bytes, longUid, true);
        expect(hashUID.length).toEqual(MAX_CHARS_API.UID);
        expect(hashUID).toEqual(
            'sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229-original-uid-vEFmcWKJ0q0eeNWIN4OLZ8yJnSDdC8DT9CndSxOnnPC47VWjQHu0psXB25lZuCt4EWsWAtgmCPWe1Wa0AIL0y8rlPn0qbB05u3WuyOst8XYkJNWz6gYx@domaine.com'
        );
    });
});

describe('getOriginalUID', () => {
    const bytes = stringToUint8Array('some random words for the test');
    const shortUid = 'stmyce9lb3ef@domain.com';
    const longUid =
        'Cm5XpErjCp4syBD1zI0whscVHuQklN3tvXxxXpaewdBGEpOFTcMCqM8WDLLYDM6kuXAqdTqL1y98SRrf5thkyceT01boWtEeCkrep75kRiKnHE5YnBKYvEFmcWKJ0q0eeNWIN4OLZ8yJnSDdC8DT9CndSxOnnPC47VWjQHu0psXB25lZuCt4EWsWAtgmCPWe1Wa0AIL0y8rlPn0qbB05u3WuyOst8XYkJNWz6gYx@domaine.com';
    const longUidLength = longUid.length;

    it('should return the empty string if passed nothing', () => {
        expect(getOriginalUID()).toEqual('');
    });

    it('should retrieve the original short UIDs after the hash operation (legacy or not)', async () => {
        expect(getOriginalUID(await generateVeventHashUID(bytes, shortUid))).toEqual(shortUid);
        expect(getOriginalUID(await generateVeventHashUID(bytes, shortUid, true))).toEqual(shortUid);
    });

    it('should retrieve no UID after the hash operation if there was none before', async () => {
        expect(getOriginalUID(await generateVeventHashUID(bytes))).toEqual('');
    });

    it('should retrieve a cropped version of long UIDs after the hash operation (legacy or not)', async () => {
        expect(getOriginalUID(await generateVeventHashUID(bytes, longUid))).toEqual(
            longUid.substring(longUidLength - 128, longUidLength)
        );
        expect(getOriginalUID(await generateVeventHashUID(bytes, longUid, true))).toEqual(
            longUid.substring(longUidLength - 128, longUidLength)
        );
    });

    it('should return the uid if it is not a hash', async () => {
        expect(getOriginalUID('random-uid')).toEqual('random-uid');
    });
});

describe('getHasLegacyHashUID', () => {
    const bytes = stringToUint8Array('some random words for the test');
    const shortUid = 'stmyce9lb3ef@domain.com';
    const longUid =
        'Cm5XpErjCp4syBD1zI0whscVHuQklN3tvXxxXpaewdBGEpOFTcMCqM8WDLLYDM6kuXAqdTqL1y98SRrf5thkyceT01boWtEeCkrep75kRiKnHE5YnBKYvEFmcWKJ0q0eeNWIN4OLZ8yJnSDdC8DT9CndSxOnnPC47VWjQHu0psXB25lZuCt4EWsWAtgmCPWe1Wa0AIL0y8rlPn0qbB05u3WuyOst8XYkJNWz6gYx@domaine.com';

    it('should return false if the empty string is passed', () => {
        expect(getHasLegacyHashUID('')).toEqual(false);
    });

    it('should return false if a new hash uid is passed', async () => {
        expect(getHasLegacyHashUID(await generateVeventHashUID(bytes, shortUid))).toEqual(false);
        expect(getHasLegacyHashUID(await generateVeventHashUID(bytes, longUid))).toEqual(false);
    });

    it('should return true if a legacy uid is passed', async () => {
        expect(getHasLegacyHashUID(await generateVeventHashUID(bytes, shortUid, true))).toEqual(true);
        expect(getHasLegacyHashUID(await generateVeventHashUID(bytes, longUid, true))).toEqual(true);
    });
});

describe('getNaiveDomainFromUID', () => {
    it('should return the domain when the uid has the expected format', () => {
        const uids = [
            'wETnJu3LPvN66KXRDJMYFxmq77Ys@proton.me',
            'qkbndaqtgkuj4nfr21adr86etk@google.com',
            '2022-01-04GB-SCT1027lieuregion@www.officeholidays.com',
        ];
        const expected = ['proton.me', 'google.com', 'www.officeholidays.com'];

        expect(uids.map((uid) => getNaiveDomainFromUID(uid))).toEqual(expected);
    });

    it("should return the domain when the uid has multiple @'s", () => {
        const uids = ['9O@8@8yk@google.com'];
        const expected = ['google.com'];

        expect(uids.map((uid) => getNaiveDomainFromUID(uid))).toEqual(expected);
    });

    it('should return an empty string when the uid has a Proton legacy format', () => {
        expect(getNaiveDomainFromUID('proton-calendar-350095ea-4368-26f0-4fc9-60a56015b02e')).toEqual('');
    });

    it('should return an empty string for the domain', () => {
        expect(getNaiveDomainFromUID('')).toEqual('');
        expect(getNaiveDomainFromUID('something')).toEqual('');
        expect(getNaiveDomainFromUID('something@')).toEqual('');
    });
});
