import {
    parseWithRecovery,
    reformatDateTimes,
    reformatLineBreaks,
    unfoldLines,
} from '../../lib/calendar/icsSurgery/ics';

describe('reformatLineBreaks()', () => {
    it('should reformat line breaks with RFC 7896 properties', () => {
        const vcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Office Holidays Ltd.//EN
X-WR-CALNAME:United Kingdom Holidays
X-WR-CALDESC:Public Holidays in United Kingdom. Provided by http://www.officeholidays.com
REFRESH-INTERVAL;VALUE=DURATION:PT48H
X-PUBLISHED-TTL:PT48H
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-MS-OLK-FORCEINSPECTOROPEN:TRUE
BEGIN:VEVENT
CLASS:PUBLIC
UID:2022-01-04GB-SCT1027lieuregion@www.officeholidays.com
CREATED:20220109T153551Z
DESCRIPTION: This additional days holiday for New Year in the UK is observed only in Scotland
\\n\\nScotland\\n\\nInformation provided by www.officeholidays.com
URL:https://www.officeholidays.com/holidays/united-kingdom/scotland/day-after-new-years-day
DTSTART;VALUE=DATE:20220104
DTEND;VALUE=DATE:20220105
DTSTAMP:20080101T000000Z
LOCATION:Scotland
PRIORITY:5
LAST-MODIFIED:20191229T000000Z
SEQUENCE:1
SUMMARY;LANGUAGE=en-us:Day after New Year's Day (in lieu) (Regional Holiday)
TRANSP:OPAQUE
X-MICROSOFT-CDO-BUSYSTATUS:BUSY
X-MICROSOFT-CDO-IMPORTANCE:1
X-MICROSOFT-DISALLOW-COUNTER:FALSE
X-MS-OLK-ALLOWEXTERNCHECK:TRUE
X-MS-OLK-AUTOFILLLOCATION:FALSE
X-MICROSOFT-CDO-ALLDAYEVENT:TRUE
X-MICROSOFT-MSNCALENDAR-ALLDAYEVENT:TRUE
X-MS-OLK-CONFTYPE:0
END:VEVENT
END:VCALENDAR`;
        expect(reformatLineBreaks(vcal)).toEqual(`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Office Holidays Ltd.//EN
X-WR-CALNAME:United Kingdom Holidays
X-WR-CALDESC:Public Holidays in United Kingdom. Provided by http://www.officeholidays.com
REFRESH-INTERVAL;VALUE=DURATION:PT48H
X-PUBLISHED-TTL:PT48H
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-MS-OLK-FORCEINSPECTOROPEN:TRUE
BEGIN:VEVENT
CLASS:PUBLIC
UID:2022-01-04GB-SCT1027lieuregion@www.officeholidays.com
CREATED:20220109T153551Z
DESCRIPTION: This additional days holiday for New Year in the UK is observed only in Scotland
 \\n\\nScotland\\n\\nInformation provided by www.officeholidays.com
URL:https://www.officeholidays.com/holidays/united-kingdom/scotland/day-after-new-years-day
DTSTART;VALUE=DATE:20220104
DTEND;VALUE=DATE:20220105
DTSTAMP:20080101T000000Z
LOCATION:Scotland
PRIORITY:5
LAST-MODIFIED:20191229T000000Z
SEQUENCE:1
SUMMARY;LANGUAGE=en-us:Day after New Year's Day (in lieu) (Regional Holiday)
TRANSP:OPAQUE
X-MICROSOFT-CDO-BUSYSTATUS:BUSY
X-MICROSOFT-CDO-IMPORTANCE:1
X-MICROSOFT-DISALLOW-COUNTER:FALSE
X-MS-OLK-ALLOWEXTERNCHECK:TRUE
X-MS-OLK-AUTOFILLLOCATION:FALSE
X-MICROSOFT-CDO-ALLDAYEVENT:TRUE
X-MICROSOFT-MSNCALENDAR-ALLDAYEVENT:TRUE
X-MS-OLK-CONFTYPE:0
END:VEVENT
END:VCALENDAR`);
    });
});

describe('unfoldLines()', () => {
    it('unfolds a properly folded ICS', () => {
        expect(
            unfoldLines(
                `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
CLASS:PUBLIC
DESCRIPTION:Join us for a look at new product updates so you ca
 n do more with your content and accelerate your workflows.

 Hooray!
LOCATION:Multiple
  lines
SUMMARY:The Drop: Fall Launch
TRANSP:TRANSPARENT
DTSTART:20221025T130000Z
DTEND:20221026T070000Z
URL:https://experience.dropbox.com/events-webinars/thedigitaldr
 op-fall2022
END:VEVENT
END:VCALENDAR`,
                '\n'
            )
        ).toEqual(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
CLASS:PUBLIC
DESCRIPTION:Join us for a look at new product updates so you can do more with your content and accelerate your workflows.\nHooray!
LOCATION:Multiple lines
SUMMARY:The Drop: Fall Launch
TRANSP:TRANSPARENT
DTSTART:20221025T130000Z
DTEND:20221026T070000Z
URL:https://experience.dropbox.com/events-webinars/thedigitaldrop-fall2022
END:VEVENT
END:VCALENDAR`);
    });
});

describe('reformatDateTimes()', () => {
    it('reformats too short or too long DTSTAMP, DTSTART, DTEND, LAST-MODIFIED', () => {
        expect(
            reformatDateTimes(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:20221010T1200
DTSTART:20221111T13
DTEND:20221111T1430
LAST-MODIFIED:20221010T120049375Z
END:VEVENT
END:VCALENDAR`)
        ).toEqual(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:20221010T120000
DTSTART:20221111T130000
DTEND:20221111T143000
LAST-MODIFIED:20221010T120049Z
END:VEVENT
END:VCALENDAR`);
    });

    it('reformats date-time properties with a time zone', () => {
        expect(
            reformatDateTimes(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP;TZID=America/Guatemala:20221010T1200
END:VEVENT
END:VCALENDAR`)
        ).toEqual(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP;TZID=America/Guatemala:20221010T120000
END:VEVENT
END:VCALENDAR`);
    });

    it('reformats folded date-time properties', () => {
        expect(
            reformatDateTimes(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTEND;TZID==/mozilla.org/20050126_1/America/Guatemala:2022
 1010T1200
END:VEVENT
END:VCALENDAR`)
        ).toEqual(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTEND;TZID==/mozilla.org/20050126_1/America/Guatemala:20221010T120000
END:VEVENT
END:VCALENDAR`);
    });

    it('reformats untrimmed date-time properties', () => {
        expect(
            reformatDateTimes(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20221010T1200
DTEND: 20221004T103000
END:VEVENT
END:VCALENDAR`)
        ).toEqual(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20221010T120000
DTEND:20221004T103000
END:VEVENT
END:VCALENDAR`);
    });

    it('reformats date-time properties with ISO format', () => {
        expect(
            reformatDateTimes(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:2022-09-02T23:59:59.999
DTSTART:2022-10-04T09:30:00.000Z
DTEND:2022-10-05T12:30:00.000ZZ
END:VEVENT
END:VCALENDAR`)
        ).toEqual(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:20220902T235959
DTSTART:20221004T093000Z
DTEND:20221005T123000Z
END:VEVENT
END:VCALENDAR`);
    });

    it('reformats all-day date-time properties missing', () => {
        expect(
            reformatDateTimes(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20221004
END:VEVENT
END:VCALENDAR`)
        ).toEqual(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20221004
END:VEVENT
END:VCALENDAR`);
    });

    it('reformats date-time properties with uncapitalized markers', () => {
        expect(
            reformatDateTimes(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:20221004t155959z
DTSTART:20221004t155959
DTEND:2022-10-05t12:30:00.000zz
END:VEVENT
END:VCALENDAR`)
        ).toEqual(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:20221004T155959Z
DTSTART:20221004T155959
DTEND:20221005T123000Z
END:VEVENT
END:VCALENDAR`);
    });
});

describe('parseWithRecovery()', () => {
    it('should parse vevent with bad enclosing and bad line breaks', () => {
        const result = parseWithRecovery(`BEGIN:VCALENDAR
METHOD:REQUEST
PRODID:Microsoft Exchange Server 2010
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:20190719T130854Z
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;TZID=America/New_York:20190719T120000
DTEND;TZID=Europe/Zurich:20190719T130000
CATEGORIES:ANNIVERSARY,PERSONAL,SPECIAL OCCASION
SUMMARY:Our Blissful Anniversary

---

Wonderful!
LOCATION:A

 secret


...
place
END:VEVENT`);

        expect(result).toEqual({
            component: 'vcalendar',
            method: { value: 'REQUEST' },
            version: { value: '2.0' },
            prodid: { value: 'Microsoft Exchange Server 2010' },
            components: [
                {
                    component: 'vevent',
                    uid: {
                        value: '7E018059-2165-4170-B32F-6936E88E61E5',
                    },
                    dtstamp: {
                        value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 8, seconds: 54, isUTC: true },
                    },
                    dtstart: {
                        value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                        parameters: { tzid: 'America/New_York' },
                    },
                    dtend: {
                        value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: false },
                        parameters: { tzid: 'Europe/Zurich' },
                    },
                    categories: [
                        {
                            value: ['ANNIVERSARY', 'PERSONAL', 'SPECIAL OCCASION'],
                        },
                    ],
                    summary: {
                        value: 'Our Blissful Anniversary---Wonderful!',
                    },
                    location: {
                        value: 'A secret...place',
                    },
                },
            ],
        });
    });

    it('should parse vevent with mixed bad line breaks', () => {
        const result = parseWithRecovery(`BEGIN:VCALENDAR
METHOD:REQUEST\r\nPRODID:Microsoft Exchange Server 2010
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:20190719T130854Z
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;TZID=America/New_York:20190719T120000
DTEND;TZID=Europe/Zurich:20190719T130000
CATEGORIES:ANNIVERSARY,PERSONAL,SPECIAL OCCASION
SUMMARY:Our Blissful Anniversary

---

Wonderful!
LOCATION:A

 secret


...
place
END:VEVENT
END:VCALENDAR`);

        expect(result).toEqual({
            component: 'vcalendar',
            method: { value: 'REQUEST' },
            version: { value: '2.0' },
            prodid: { value: 'Microsoft Exchange Server 2010' },
            components: [
                {
                    component: 'vevent',
                    uid: {
                        value: '7E018059-2165-4170-B32F-6936E88E61E5',
                    },
                    dtstamp: {
                        value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 8, seconds: 54, isUTC: true },
                    },
                    dtstart: {
                        value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                        parameters: { tzid: 'America/New_York' },
                    },
                    dtend: {
                        value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: false },
                        parameters: { tzid: 'Europe/Zurich' },
                    },
                    categories: [
                        {
                            value: ['ANNIVERSARY', 'PERSONAL', 'SPECIAL OCCASION'],
                        },
                    ],
                    summary: {
                        value: 'Our Blissful Anniversary---Wonderful!',
                    },
                    location: {
                        value: 'A secret...place',
                    },
                },
            ],
        });
    });

    it('should parse vevent with badly formatted date-time properties', () => {
        const result = parseWithRecovery(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:20190719T1308
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;TZID=America/New_York:2019-07-19T12:00:00:000
DTEND: 20290719
LAST-MODIFIED : 20190719t1308zZ
END:VEVENT
END:VCALENDAR`);

        expect(result).toEqual({
            component: 'vcalendar',
            version: { value: '2.0' },
            components: [
                {
                    component: 'vevent',
                    uid: {
                        value: '7E018059-2165-4170-B32F-6936E88E61E5',
                    },
                    dtstamp: {
                        value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 8, seconds: 0, isUTC: false },
                    },
                    dtstart: {
                        value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                        parameters: { tzid: 'America/New_York' },
                    },
                    dtend: {
                        value: { year: 2029, month: 7, day: 19 },
                        parameters: { type: 'date' },
                    },
                    'last-modified': {
                        value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 8, seconds: 0, isUTC: true },
                    },
                },
            ],
        });
    });

    it('should parse vevent with ISO-formatted date-time properties', () => {
        const result = parseWithRecovery(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:20230202T091854Z
UID:537emc1okj91qjup2ape67987975464123154@google.com
DTSTART:2023-02-04T09:30:00.000Z
DTEND:2023-02-04T09:30:00.000Z
RECURRENCE-ID:2023-02-04T10:30:00.000Z
END:VEVENT
END:VCALENDAR`);

        expect(result).toEqual({
            component: 'vcalendar',
            version: { value: '2.0' },
            components: [
                {
                    component: 'vevent',
                    uid: {
                        value: '537emc1okj91qjup2ape67987975464123154@google.com',
                    },
                    dtstamp: {
                        value: { year: 2023, month: 2, day: 2, hours: 9, minutes: 18, seconds: 54, isUTC: true },
                    },
                    dtstart: {
                        value: { year: 2023, month: 2, day: 4, hours: 9, minutes: 30, seconds: 0, isUTC: true },
                    },
                    dtend: {
                        value: { year: 2023, month: 2, day: 4, hours: 9, minutes: 30, seconds: 0, isUTC: true },
                    },
                    'recurrence-id': {
                        value: { year: 2023, month: 2, day: 4, hours: 10, minutes: 30, seconds: 0, isUTC: true },
                    },
                },
            ],
        });
    });
});
