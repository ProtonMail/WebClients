import { getCaptureDateTime, getCaptureDateTimeString, getFormattedDateTime } from './exifUtils';

describe('exif', () => {
    const mockExif = {
        DateTime: {
            id: 306,
            value: ['2024:01:07 10:00:53'],
            description: '2024:01:07 10:00:53',
        },
        DateTimeOriginal: {
            id: 36867,
            value: ['2024:01:07 09:00:53'],
            description: '2024:01:07 09:00:53',
        },
        DateTimeDigitized: {
            id: 36868,
            value: ['2024:01:07 08:00:53'],
            description: '2024:01:07 08:00:53',
        },
    };

    describe('getFormattedDateTime', () => {
        it('should return `DateTimeOriginal` when all params present', () => {
            const formattedDateTime = getFormattedDateTime(mockExif);
            expect(formattedDateTime).toBe('2024-01-07 09:00:53');
        });
        it('should return `DateTimeDigitized` if `DateTimeOriginal` is missing', () => {
            const mock = { ...mockExif, DateTimeOriginal: undefined };
            const formattedDateTime = getFormattedDateTime(mock);
            expect(formattedDateTime).toBe('2024-01-07 08:00:53');
        });
        it('should return `DateTime` if `DateTimeDigitized` and `DateTimeOriginal` is missing', () => {
            const mock = { ...mockExif, DateTimeOriginal: undefined, DateTimeDigitized: undefined };
            const formattedDateTime = getFormattedDateTime(mock);
            expect(formattedDateTime).toBe('2024-01-07 10:00:53');
        });
        it('should return `undefined` if none of prefered props are present', () => {
            const mock = {};
            const formattedDateTime = getFormattedDateTime(mock);
            expect(formattedDateTime).toBe(undefined);
        });
        it('should parse first parsable date', () => {
            const mock = {
                ...mockExif,
                DateTimeOriginal: {
                    ...mockExif.DateTimeOriginal,
                    value: ['some random text'],
                },
            };

            expect(getFormattedDateTime(mock)).toBe('2024-01-07 08:00:53');
            const mock2 = {
                ...mock,
                DateTimeDigitized: {
                    ...mockExif.DateTimeDigitized,
                    value: [],
                },
            };
            expect(getFormattedDateTime(mock2)).toBe('2024-01-07 10:00:53');
        });
    });
    describe('getCaptureDateTimeString', () => {
        it('should return `DateTimeOriginal` when all params present', () => {
            const value = getCaptureDateTimeString(mockExif);
            const date = new Date(value!);
            expect(date.getUTCFullYear()).toBe(2024);
            expect(date.getUTCMonth()).toBe(0);
            expect(date.getUTCDate()).toBe(7);
            expect(date.getUTCHours()).toBe(9);
            expect(date.getUTCMinutes()).toBe(0);
            expect(date.getUTCSeconds()).toBe(53);
        });
        it('should return `DateTimeDigitized` if `DateTimeOriginal` is missing', () => {
            const mock = { ...mockExif, DateTimeOriginal: undefined };
            const value = getCaptureDateTimeString(mock);
            const date = new Date(value!);
            expect(date.getUTCFullYear()).toBe(2024);
            expect(date.getUTCMonth()).toBe(0);
            expect(date.getUTCDate()).toBe(7);
            expect(date.getUTCHours()).toBe(8);
            expect(date.getUTCMinutes()).toBe(0);
            expect(date.getUTCSeconds()).toBe(53);
        });
        it('should return `DateTime` if `DateTimeDigitized` and `DateTimeOriginal` is missing', () => {
            const mock = { ...mockExif, DateTimeOriginal: undefined, DateTimeDigitized: undefined };
            const value = getCaptureDateTimeString(mock);
            const date = new Date(value!);
            expect(date.getUTCFullYear()).toBe(2024);
            expect(date.getUTCMonth()).toBe(0);
            expect(date.getUTCDate()).toBe(7);
            expect(date.getUTCHours()).toBe(10);
            expect(date.getUTCMinutes()).toBe(0);
            expect(date.getUTCSeconds()).toBe(53);
        });
        it('should return `undefined` if none of prefered props are present', () => {
            const mock = {};
            const value = getCaptureDateTimeString(mock);
            expect(value).toBe(undefined);
        });
        it('should return current date for pre-epoch dates (before 1970)', () => {
            const mockPreEpoch = {
                DateTimeOriginal: {
                    id: 36867,
                    value: ['1892:10:06 14:56:16'],
                    description: '1892:10:06 14:56:16',
                },
            };
            const beforeTest = new Date();
            const value = getCaptureDateTimeString(mockPreEpoch);
            const afterTest = new Date();
            const date = new Date(value!);

            expect(date.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
            expect(date.getTime()).toBeLessThanOrEqual(afterTest.getTime());
        });
    });
    describe('getCaptureDateTime', () => {
        const mockFile = new File(['content'], 'test.jpg', {
            type: 'image/jpeg',
            lastModified: new Date('2024-01-01').getTime(),
        });

        it('should return current date for pre-epoch dates (before 1970)', () => {
            const mockPreEpoch = {
                DateTimeOriginal: {
                    id: 36867,
                    value: ['1892:10:06 14:56:16'],
                    description: '1892:10:06 14:56:16',
                },
            };
            const beforeTest = new Date();
            const date = getCaptureDateTime(mockFile, mockPreEpoch);
            const afterTest = new Date();

            expect(date.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
            expect(date.getTime()).toBeLessThanOrEqual(afterTest.getTime());
        });

        it('should return valid date for post-epoch dates', () => {
            const mockPostEpoch = {
                DateTimeOriginal: {
                    id: 36867,
                    value: ['2024:01:07 09:00:53'],
                    description: '2024:01:07 09:00:53',
                },
            };
            const date = getCaptureDateTime(mockFile, mockPostEpoch);

            expect(date.getFullYear()).toBe(2024);
            expect(date.getMonth()).toBe(0);
            expect(date.getDate()).toBe(7);
        });

        it('should use file lastModified when no EXIF data present', () => {
            const date = getCaptureDateTime(mockFile, undefined);
            const expectedDate = new Date(mockFile.lastModified);

            expect(date.getTime()).toBe(expectedDate.getTime());
        });
    });
});
