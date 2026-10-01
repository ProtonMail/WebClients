import { getCaptureDateTime, getCaptureDateTimeString, getFormattedDateTime } from './exifUtils';

describe('exif', () => {
    const MOCK_NOW = new Date('2026-01-30T10:30:00Z');
    const MOCK_NOW_TIMESTAMP = MOCK_NOW.getTime();

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_NOW);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

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
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const date = new Date(value!);
            expect(date.getFullYear()).toBe(2024);
            expect(date.getMonth()).toBe(0);
            expect(date.getDate()).toBe(7);
            expect(date.getHours()).toBe(9);
            expect(date.getMinutes()).toBe(0);
            expect(date.getSeconds()).toBe(53);
        });
        it('should return `DateTimeDigitized` if `DateTimeOriginal` is missing', () => {
            const mock = { ...mockExif, DateTimeOriginal: undefined };
            const value = getCaptureDateTimeString(mock);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const date = new Date(value!);
            expect(date.getFullYear()).toBe(2024);
            expect(date.getMonth()).toBe(0);
            expect(date.getDate()).toBe(7);
            expect(date.getHours()).toBe(8);
            expect(date.getMinutes()).toBe(0);
            expect(date.getSeconds()).toBe(53);
        });
        it('should return `DateTime` if `DateTimeDigitized` and `DateTimeOriginal` is missing', () => {
            const mock = { ...mockExif, DateTimeOriginal: undefined, DateTimeDigitized: undefined };
            const value = getCaptureDateTimeString(mock);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const date = new Date(value!);
            expect(date.getFullYear()).toBe(2024);
            expect(date.getMonth()).toBe(0);
            expect(date.getDate()).toBe(7);
            expect(date.getHours()).toBe(10);
            expect(date.getMinutes()).toBe(0);
            expect(date.getSeconds()).toBe(53);
        });
        it('should return `undefined` if none of prefered props are present', () => {
            const mock = {};
            const value = getCaptureDateTimeString(mock);
            expect(value).toBe(undefined);
        });
        it('should return the parsed date for pre-epoch dates (before 1970)', () => {
            const mockPreEpoch = {
                DateTimeOriginal: {
                    id: 36867,
                    value: ['1892:10:06 14:56:16'],
                    description: '1892:10:06 14:56:16',
                },
            };
            const value = getCaptureDateTimeString(mockPreEpoch);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const date = new Date(value!);

            expect(date.getFullYear()).toBe(1892);
            expect(date.getMonth()).toBe(9);
            expect(date.getDate()).toBe(6);
            expect(date.getHours()).toBe(14);
            expect(date.getMinutes()).toBe(56);
            expect(date.getSeconds()).toBe(16);
        });
        it('should keep the wall-clock time and append the matching EXIF offset', () => {
            const mock = {
                ...mockExif,
                OffsetTimeOriginal: { id: 36881, value: ['+09:00'], description: '+09:00' },
                OffsetTime: { id: 36880, value: ['-05:00'], description: '-05:00' },
            };
            expect(getCaptureDateTimeString(mock)).toBe('2024-01-07T09:00:53.000+09:00');
        });
        it('should return the real UTC instant, interpreted in the browser timezone, without EXIF offset', () => {
            const mock = {
                ...mockExif,
                OffsetTimeOriginal: { id: 36881, value: ['   :  '], description: '   :  ' },
            };
            expect(getCaptureDateTimeString(mock)).toBe(new Date(2024, 0, 7, 9, 0, 53).toISOString());
        });
    });
    describe('getCaptureDateTime', () => {
        const mockFile = new File(['content'], 'test.jpg', {
            type: 'image/jpeg',
            lastModified: new Date('2024-01-01').getTime(),
        });

        it('should use the EXIF offset to compute the exact UTC instant', () => {
            const mock = {
                ...mockExif,
                OffsetTimeOriginal: { id: 36881, value: ['+02:00'], description: '+02:00' },
            };
            const date = getCaptureDateTime(mockFile, mock);

            expect(date.toISOString()).toBe('2024-01-07T07:00:53.000Z');
        });

        it('should return the parsed date for pre-epoch dates (before 1970)', () => {
            const mockPreEpoch = {
                DateTimeOriginal: {
                    id: 36867,
                    value: ['1892:10:06 14:56:16'],
                    description: '1892:10:06 14:56:16',
                },
            };
            const date = getCaptureDateTime(mockFile, mockPreEpoch);

            expect(date.getFullYear()).toBe(1892);
            expect(date.getMonth()).toBe(9);
            expect(date.getDate()).toBe(6);
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

        describe('invalid date handling', () => {
            it('should return current date for invalid EXIF month (month 13)', () => {
                const mockInvalidMonth = {
                    DateTimeOriginal: {
                        id: 36867,
                        value: ['2024:13:15 10:30:00'],
                        description: '2024:13:15 10:30:00',
                    },
                };

                const date = getCaptureDateTime(mockFile, mockInvalidMonth);

                // Should return the mocked current date
                expect(date.getTime()).toBe(MOCK_NOW_TIMESTAMP);
            });

            it('should return current date for zero EXIF date (0000:00:00)', () => {
                const mockZeroDate = {
                    DateTimeOriginal: {
                        id: 36867,
                        value: ['0000:00:00 00:00:00'],
                        description: '0000:00:00 00:00:00',
                    },
                };

                const date = getCaptureDateTime(mockFile, mockZeroDate);

                // Should return the mocked current date
                expect(date.getTime()).toBe(MOCK_NOW_TIMESTAMP);
            });

            it('should fall back to file.lastModified when EXIF date can not be parsed', () => {
                const mockInvalid = {
                    DateTimeOriginal: {
                        id: 36867,
                        value: ['invalid'],
                        description: 'invalid',
                    },
                };

                // Create a file with valid lastModified that's not "now"
                const pastDate = new Date('2024-06-15').getTime();
                const fileWithPastDate = new File(['content'], 'test.jpg', {
                    type: 'image/jpeg',
                    lastModified: pastDate,
                });

                const date = getCaptureDateTime(fileWithPastDate, mockInvalid);

                // Should use file.lastModified as fallback
                expect(date.getTime()).toBe(pastDate);
            });
        });
    });
});
