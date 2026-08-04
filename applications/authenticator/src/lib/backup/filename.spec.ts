import {
    createAutomaticBackupFilename,
    createBackupFilename,
    getBackupFilenameRegex,
    parseDateFromFilename,
} from './filename';

describe('Backup filename utilities', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('createAutomaticBackupFilename', () => {
        test('should create filename with current date', () => {
            jest.setSystemTime(new Date('2023-12-15T10:30:45.123Z'));
            const result = createAutomaticBackupFilename();
            expect(result).toBe('Proton Authenticator_export_2023-12-15.json');
        });

        test('should pad single digit months and days', () => {
            jest.setSystemTime(new Date('2023-01-05T10:30:45.123Z'));
            const result = createAutomaticBackupFilename();
            expect(result).toBe('Proton Authenticator_export_2023-01-05.json');
        });
    });

    describe('createBackupFilename', () => {
        test('should suffix the automatic filename with the current epoch', () => {
            const now = new Date('2023-12-15T10:30:45.123Z');
            jest.setSystemTime(now);

            const epoch = Math.round(+now / 1_000);
            const result = createBackupFilename();

            expect(result).toBe(`Proton Authenticator_export_2023-12-15.json_${epoch}.json`);
        });

        test('should not match the automatic backup filename format', () => {
            jest.setSystemTime(new Date('2023-12-15T10:30:45.123Z'));
            expect(getBackupFilenameRegex().test(createBackupFilename())).toBe(false);
        });
    });

    describe('parseDateFromFilename', () => {
        test('should parse the date out of an automatic backup filename', () => {
            const result = parseDateFromFilename('Proton Authenticator_export_2023-12-15.json');
            expect(result).toEqual(new Date(2023, 11, 15));
        });

        test('should parse the date of the filename it creates', () => {
            jest.setSystemTime(new Date('2023-01-05T10:30:45.123Z'));
            const result = parseDateFromFilename(createAutomaticBackupFilename());
            expect(result).toEqual(new Date(2023, 0, 5));
        });

        test.each([
            'invalid_format.json',
            'another_invalid.txt',
            'Proton Authenticator_export_2023-12-15.json_1702636245.json',
            '',
        ])('should return null for `%s`', (filename) => {
            expect(parseDateFromFilename(filename)).toBeNull();
        });
    });
});
