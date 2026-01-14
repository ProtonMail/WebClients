import { MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';

import { getQueryParamsStatus, validateDeepLinkParams } from './utils';

describe('getQueryParamsStatus', () => {
    it('should detect create mode with calendar ID', () => {
        const result = getQueryParamsStatus('?action=create');

        expect(result).toEqual({
            isCreateMode: true,
            isEditMode: false,
            calendarIdFromQueryParams: null,
            eventId: null,
        });
    });

    it('should detect edit mode with event and calendar IDs', () => {
        const result = getQueryParamsStatus('?action=edit&calendarId=123&eventId=456');

        expect(result).toEqual({
            isCreateMode: false,
            isEditMode: true,
            calendarIdFromQueryParams: '123',
            eventId: '456',
        });
    });

    it('should handle empty search params', () => {
        const result = getQueryParamsStatus('');

        expect(result).toEqual({
            isCreateMode: false,
            isEditMode: false,
            calendarIdFromQueryParams: null,
            eventId: null,
        });
    });

    it('should handle unrelated parameters', () => {
        const result = getQueryParamsStatus('?action=edit&calendarId=123&view=week&date=2023-10-10');

        expect(result).toEqual({
            isCreateMode: false,
            isEditMode: true,
            calendarIdFromQueryParams: '123',
            eventId: null,
        });
    });
});

describe('validateDeepLinkParams', () => {
    describe('valid inputs', () => {
        it('should return all valid parameters when within length limits', () => {
            const searchParams = new URLSearchParams(
                '?title=Team Meeting&location=Office&description=Quarterly review meeting'
            );
            const result = validateDeepLinkParams(searchParams);

            expect(result).toEqual({
                title: 'Team Meeting',
                location: 'Office',
                description: 'Quarterly review meeting',
                conferenceUrl: undefined,
            });
        });

        it('should handle special characters in parameters', () => {
            const searchParams = new URLSearchParams();
            searchParams.set('title', 'Meeting @ 3pm & discussion');
            searchParams.set('location', 'Building #5, Floor 2');
            searchParams.set('description', 'Q&A session with stakeholders (important!)');

            const result = validateDeepLinkParams(searchParams);

            expect(result.title).toBe('Meeting @ 3pm & discussion');
            expect(result.location).toBe('Building #5, Floor 2');
            expect(result.description).toBe('Q&A session with stakeholders (important!)');
        });

        it('should handle unicode characters', () => {
            const searchParams = new URLSearchParams();
            searchParams.set('title', "Réunion d'équipe 開會");
            searchParams.set('location', 'São Paulo');

            const result = validateDeepLinkParams(searchParams);

            expect(result.title).toBe("Réunion d'équipe 開會");
            expect(result.location).toBe('São Paulo');
        });
    });

    describe('null and empty inputs', () => {
        it('should return undefined for missing parameters', () => {
            const searchParams = new URLSearchParams('');
            const result = validateDeepLinkParams(searchParams);

            expect(result).toEqual({
                title: undefined,
                location: undefined,
                description: undefined,
                conferenceUrl: undefined,
            });
        });

        it('should return undefined for empty string parameters', () => {
            const searchParams = new URLSearchParams('?title=&location=&description=');
            const result = validateDeepLinkParams(searchParams);

            expect(result).toEqual({
                title: undefined,
                location: undefined,
                description: undefined,
                conferenceUrl: undefined,
            });
        });

        it('should handle mixed empty and valid parameters', () => {
            const searchParams = new URLSearchParams('?title=Valid Title&location=&description=');
            const result = validateDeepLinkParams(searchParams);

            expect(result.title).toBe('Valid Title');
            expect(result.location).toBeUndefined();
            expect(result.description).toBeUndefined();
        });
    });

    describe('length validation and truncation', () => {
        it('should truncate title', () => {
            const tooLongTitle = 'a'.repeat(MAX_CHARS_API.TITLE + 50);
            const searchParams = new URLSearchParams();
            searchParams.set('title', tooLongTitle);

            const result = validateDeepLinkParams(searchParams);

            expect(result.title?.length).toBe(MAX_CHARS_API.TITLE);
        });

        it('should truncate location', () => {
            const tooLongLocation = 'b'.repeat(MAX_CHARS_API.LOCATION + 50);
            const searchParams = new URLSearchParams();
            searchParams.set('location', tooLongLocation);

            const result = validateDeepLinkParams(searchParams);

            expect(result.location?.length).toBe(MAX_CHARS_API.LOCATION);
        });

        it('should truncate description', () => {
            const tooLongDescription = 'c'.repeat(MAX_CHARS_API.EVENT_DESCRIPTION + 50);
            const searchParams = new URLSearchParams();
            searchParams.set('description', tooLongDescription);

            const result = validateDeepLinkParams(searchParams);

            expect(result.description?.length).toBe(MAX_CHARS_API.EVENT_DESCRIPTION);
        });

        it('should trim whitespace before truncating', () => {
            const stringWithSpaces = '   ' + 'x'.repeat(MAX_CHARS_API.TITLE + 50) + '   ';
            const searchParams = new URLSearchParams();
            searchParams.set('title', stringWithSpaces);

            const result = validateDeepLinkParams(searchParams);

            expect(result.title?.length).toBe(MAX_CHARS_API.TITLE);
        });

        it('should accept one valid and truncate one too long parameter', () => {
            const validString = 'Valid Meeting Title';
            const tooLongString = 'x'.repeat(MAX_CHARS_API.EVENT_DESCRIPTION + 50);
            const searchParams = new URLSearchParams();
            searchParams.set('title', validString);
            searchParams.set('description', tooLongString);

            const result = validateDeepLinkParams(searchParams);

            expect(result.title).toBe(validString);
            expect(result.description?.length).toBe(MAX_CHARS_API.EVENT_DESCRIPTION);
        });
    });

    describe('conference URL validation', () => {
        it('should accept valid Proton Meet URLs', () => {
            const validMeetUrl = 'https://meet.proton.me/id-AAA1A8A1A0#pwd-DDDDDDDDDDDD';
            const searchParams = new URLSearchParams();
            searchParams.set('conferenceUrl', validMeetUrl);

            const result = validateDeepLinkParams(searchParams);

            expect(result.conferenceUrl).toBe('https://meet.proton.me/id-AAA1A8A1A0#pwd-DDDDDDDDDDDD');
        });

        it('should reject invalid URLs', () => {
            const invalidUrl = 'https://meet.proton.me/id-AAA1#pwd-DDDDD';
            const searchParams = new URLSearchParams();
            searchParams.set('conferenceUrl', invalidUrl);

            const result = validateDeepLinkParams(searchParams);

            expect(result.conferenceUrl).toBeUndefined();
        });

        it('should reject non-URL strings', () => {
            const notAUrl = 'not-a-url';
            const searchParams = new URLSearchParams();
            searchParams.set('conferenceUrl', notAUrl);

            const result = validateDeepLinkParams(searchParams);

            expect(result.conferenceUrl).toBeUndefined();
        });

        it('should handle missing conference URL', () => {
            const searchParams = new URLSearchParams('?title=Meeting');
            const result = validateDeepLinkParams(searchParams);

            expect(result.conferenceUrl).toBeUndefined();
        });
    });

    describe('combined scenarios', () => {
        it('should handle all parameters together', () => {
            const searchParams = new URLSearchParams();
            searchParams.set('title', 'Team Standup');
            searchParams.set('location', 'Conference Room A');
            searchParams.set('description', 'Daily standup meeting');
            searchParams.set('conferenceUrl', 'https://meet.proton.me/id-AAA1A8A1A0#pwd-DDDDDDDDDDDD');

            const result = validateDeepLinkParams(searchParams);

            expect(result.title).toBe('Team Standup');
            expect(result.location).toBe('Conference Room A');
            expect(result.description).toBe('Daily standup meeting');
            expect(result.conferenceUrl).toBe('https://meet.proton.me/id-AAA1A8A1A0#pwd-DDDDDDDDDDDD');
        });

        it('should validate each parameter independently', () => {
            const tooLong = 'x'.repeat(MAX_CHARS_API.LOCATION + 50);
            const searchParams = new URLSearchParams();
            searchParams.set('title', 'Valid');
            searchParams.set('location', tooLong);
            searchParams.set('description', '');
            searchParams.set('conferenceUrl', 'invalid-url');

            const result = validateDeepLinkParams(searchParams);

            expect(result.title).toBe('Valid');
            expect(result.location?.length).toBe(MAX_CHARS_API.LOCATION);
            expect(result.description).toBeUndefined();
            expect(result.conferenceUrl).toBeUndefined();
        });
    });

    describe('security edge cases', () => {
        it('should handle potentially malicious strings safely', () => {
            const xssAttempt = '<script>alert("xss")</script>';
            const sqlInjection = "'; DROP TABLE events; --";
            const searchParams = new URLSearchParams();
            searchParams.set('title', xssAttempt);
            searchParams.set('description', sqlInjection);

            const result = validateDeepLinkParams(searchParams);

            expect(result.title).toBeUndefined();
            expect(result.description).toBe(sqlInjection);
        });

        it('should handle very long query strings gracefully', () => {
            const searchParams = new URLSearchParams();
            for (let i = 0; i < 100; i++) {
                searchParams.set(`param${i}`, 'value');
            }
            searchParams.set('title', 'Meeting');

            const result = validateDeepLinkParams(searchParams);

            expect(result.title).toBe('Meeting');
        });
    });
});
