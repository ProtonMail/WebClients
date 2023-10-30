import { formatExifDateTime } from './formatExifDateTime';

describe('formatExifDateTime()', () => {
    it("should correctly format exif's DateTime to standard Date format", () => {
        const exifDateTime = '2023:07:21 22:12:01';
        expect(formatExifDateTime(exifDateTime)).toEqual('2023-07-21 22:12:01');
    });
    it("should throw an error if exif's DateTime format is incorrect", () => {
        const exifDateTime = '2023-07:21-22:12:01';
        expect(() => formatExifDateTime(exifDateTime)).toThrowError(
            `The DateTime passed is not in the right format (received: ${exifDateTime}, expected: YYYY:MM:DD HH:MM:SS)`
        );
    });
});
