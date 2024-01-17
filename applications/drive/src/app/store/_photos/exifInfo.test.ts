import { getCaptureDateTimeString, getTimeDateSource } from './exifInfo';

describe('sortWithCategories', () => {
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

    describe('getTimeDateSource', () => {
        /*  Preferance order of capture date time is:
         * DateTimeOriginal (time when the picture was actually taken)
         * DateTimeDigitized (time when the picture was converted from analog, but also known as CreateDate)
         * DateTime (what we currently have)
         */
        it('should return `DateTimeOriginal` when all params present', () => {
            const source = getTimeDateSource(mockExif);
            expect(source?.value[0]).toBe('2024:01:07 09:00:53');
        });
        it('should return `DateTimeDigitized` if `DateTimeOriginal` is missing', () => {
            const mock = { ...mockExif, DateTimeOriginal: undefined };
            const source = getTimeDateSource(mock);
            expect(source?.value[0]).toBe('2024:01:07 08:00:53');
        });
        it('should return `DateTime` if `DateTimeDigitized` and `DateTimeOriginal` is missing', () => {
            const mock = { ...mockExif, DateTimeOriginal: undefined, DateTimeDigitized: undefined };
            const source = getTimeDateSource(mock);
            expect(source?.value[0]).toBe('2024:01:07 10:00:53');
        });
        it('should return `undefined` if none of prefered props are present', () => {
            const mock = {};
            const source = getTimeDateSource(mock);
            expect(source?.value[0]).toBe(undefined);
        });
    });
    // FIXME `toISOString()` return timezone releated output.
    // for example if machine is in timezone +02 for dateTime value `2024:01:07 09:00:53` it returns `2024-01-07T07:00:53.000Z`
    // pay attention to hours
    xdescribe('getCaptureDateTimeString', () => {
        it('should return `DateTimeOriginal` when all params present', () => {
            const value = getCaptureDateTimeString(mockExif);
            expect(value).toBe('2024-01-07T07:00:53.000Z');
        });
        it('should return `DateTimeDigitized` if `DateTimeOriginal` is missing', () => {
            const mock = { ...mockExif, DateTimeOriginal: undefined };
            const value = getCaptureDateTimeString(mock);
            expect(value).toBe('2024-01-07T06:00:53.000Z');
        });
        it('should return `DateTime` if `DateTimeDigitized` and `DateTimeOriginal` is missing', () => {
            const mock = { ...mockExif, DateTimeOriginal: undefined, DateTimeDigitized: undefined };
            const value = getCaptureDateTimeString(mock);
            expect(value).toBe('2024-01-07T08:00:53.000Z');
        });
        it('should return `undefined` if none of prefered props are present', () => {
            const mock = {};
            const value = getCaptureDateTimeString(mock);
            expect(value).toBe(undefined);
        });
    });
});
