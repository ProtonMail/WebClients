import { readableTime, readableTimeIntl } from '@proton/shared/lib/helpers/time';
import { enUSLocale } from '@proton/shared/lib/i18n/dateFnLocales';

describe('readableTime()', () => {
    const unixTime = 1666438769; // Sat Oct 22 2022 13:39:29 GMT+0200 (Central European Summer Time)

    let originalDateNow: any;
    let mockedTime: number;

    function setMockedTime(time: number) {
        mockedTime = time;
    }

    beforeEach(() => {
        originalDateNow = Date.now;
        setMockedTime(originalDateNow());
        Date.now = () => mockedTime;
    });

    afterEach(() => {
        Date.now = originalDateNow;
    });

    it("should return formatted date if it is not today's date", () => {
        expect(readableTime(unixTime)).toEqual('Oct 22, 2022');
    });

    it('should return time if the day is today', () => {
        setMockedTime(unixTime * 1000);

        expect(
            readableTime(unixTime, {
                locale: enUSLocale,
            })
        ).toMatch(/AM|PM/); // essentially checking that it's X:XX AM or X:XX PM. By using regex, I bypass the problem of the time zones
    });

    it('should apply custom time format for the same day', () => {
        setMockedTime(unixTime * 1000);

        expect(
            readableTime(unixTime, {
                locale: enUSLocale,
                sameDayFormat: 'PP',
            })
        ).toEqual('Oct 22, 2022');
    });

    it('should apply custom time format if it is different day', () => {
        expect(
            readableTime(unixTime, {
                format: 'p',
            })
        ).toMatch(/AM|PM/); // essentially checking that it's X:XX AM or X:XX PM. By using regex, I bypass the problem of the time zones
    });

    it('should use format parameter if sameDayFormat is false', () => {
        setMockedTime(unixTime * 1000);

        expect(
            readableTime(unixTime, {
                locale: enUSLocale,
                sameDayFormat: false,
            })
        ).toEqual('Oct 22, 2022');
    });
});

describe('readableTimeIntl()', () => {
    const unixTime = 1666438769; // Sat Oct 22 2022 13:39:29 GMT+0200 (Central European Summer Time)

    let originalDateNow: any;
    let mockedTime: number;

    function setMockedTime(time: number) {
        mockedTime = time;
    }

    beforeEach(() => {
        originalDateNow = Date.now;
        setMockedTime(originalDateNow());
        Date.now = () => mockedTime;
    });

    afterEach(() => {
        Date.now = originalDateNow;
    });

    it("should return formatted date if it is not today's date", () => {
        expect(readableTimeIntl(unixTime)).toEqual('Oct 22, 2022');
    });

    it('should return correct time format with different localeCode', () => {
        expect(
            readableTimeIntl(unixTime, {
                localeCode: 'fr-ch',
            })
        ).toEqual('22 oct. 2022');
    });

    it('should return time if the day is today', () => {
        setMockedTime(unixTime * 1000);

        expect(
            readableTimeIntl(unixTime, {
                localeCode: enUSLocale.code,
            })
        ).toMatch(/AM|PM/); // essentially checking that it's X:XX AM or X:XX PM. By using regex, I bypass the problem of the time zones
    });

    it('should apply custom time format for the same day', () => {
        setMockedTime(unixTime);

        expect(
            readableTimeIntl(unixTime, {
                localeCode: enUSLocale.code,
                sameDayIntlOptions: { month: 'short', day: 'numeric', year: 'numeric' },
            })
        ).toEqual('Oct 22, 2022');
    });

    it('should apply custom time format if it is different day', () => {
        setMockedTime(unixTime * 1000);
        expect(
            readableTimeIntl(unixTime, {
                intlOptions: {
                    hour: 'numeric',
                    minute: 'numeric',
                },
            })
        ).toMatch(/AM|PM/); // essentially checking that it's X:XX AM or X:XX PM. By using regex, I bypass the problem of the time zones
    });

    it('should use default intl options if sameDayFormat is false', () => {
        setMockedTime(unixTime * 1000);

        const result = readableTimeIntl(unixTime, {
            localeCode: enUSLocale.code,
            sameDayIntlOptions: false,
        });

        expect(result).toEqual('Oct 22, 2022');
    });

    it('should work with force 24h format', () => {
        expect(
            readableTimeIntl(unixTime, {
                intlOptions: {
                    hour: 'numeric',
                    minute: 'numeric',
                },
                hour12: false,
            })
        ).not.toMatch(/AM|PM/);
    });
});
