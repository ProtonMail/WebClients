import * as path from '@tauri-apps/api/path';
import * as fs from '@tauri-apps/plugin-fs';

import {
    BACKUP_MAX_AMOUNT,
    createAutomaticBackupFilename,
    pruneExcessBackups,
    readCurrentBackups,
    sortBackupsByDate,
} from './writer';

jest.mock('@tauri-apps/plugin-fs');
jest.mock('@tauri-apps/api/path');

const readDir = jest.spyOn(fs, 'readDir');
const remove = jest.spyOn(fs, 'remove');

jest.spyOn(path, 'join').mockImplementation(async (dir, file) => `${dir}/${file}`);

describe('Backup writer utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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

    describe('readCurrentBackups', () => {
        test('should return backup filenames that match excluding dirs and symlinks', async () => {
            readDir.mockResolvedValueOnce([
                {
                    name: 'Proton Authenticator_export_2023-12-01.json',
                    isFile: true,
                    isDirectory: false,
                    isSymlink: false,
                },
                {
                    name: 'Proton Authenticator_export_2025-12-02.json',
                    isFile: true,
                    isDirectory: false,
                    isSymlink: false,
                },
                {
                    name: 'other_file.txt',
                    isFile: true,
                    isDirectory: false,
                    isSymlink: false,
                },
                {
                    name: 'Proton Authenticator_export_2022-09-03.json',
                    isFile: true,
                    isDirectory: false,
                    isSymlink: false,
                },
                {
                    name: 'some_dir',
                    isFile: false,
                    isDirectory: true,
                    isSymlink: false,
                },
                {
                    name: 'some_symlink',
                    isFile: false,
                    isDirectory: false,
                    isSymlink: true,
                },
                {
                    name: 'Proton Authenticator_export_2023-08-04.json',
                    isFile: true,
                    isDirectory: false,
                    isSymlink: false,
                },
            ]);

            const result = await readCurrentBackups('/test/backup/dir');

            expect(result).toEqual([
                'Proton Authenticator_export_2023-12-01.json',
                'Proton Authenticator_export_2025-12-02.json',
                'Proton Authenticator_export_2022-09-03.json',
                'Proton Authenticator_export_2023-08-04.json',
            ]);
            expect(readDir).toHaveBeenCalledWith('/test/backup/dir');
        });

        test('should return empty array when no backup files match pattern', async () => {
            readDir.mockResolvedValueOnce([
                { name: 'other_file.txt', isFile: true, isDirectory: false, isSymlink: false },
                { name: 'wrong_format.json', isFile: true, isDirectory: false, isSymlink: false },
                { name: 'some_dir', isFile: false, isDirectory: true, isSymlink: false },
            ]);

            const result = await readCurrentBackups('/test/backup/dir');
            expect(result).toEqual([]);
            expect(readDir).toHaveBeenCalledWith('/test/backup/dir');
        });

        test('should return empty array when directory is empty', async () => {
            readDir.mockResolvedValueOnce([]);

            const result = await readCurrentBackups('/test/backup/dir');
            expect(result).toEqual([]);
            expect(readDir).toHaveBeenCalledWith('/test/backup/dir');
        });
    });

    describe('sortBackupsByDate', () => {
        test('should sort by date ascending from filename', () => {
            const filenames = [
                'Proton Authenticator_export_2023-12-01.json',
                'Proton Authenticator_export_2025-12-02.json',
                'Proton Authenticator_export_2021-09-03.json',
                'Proton Authenticator_export_2026-08-04.json',
                'Proton Authenticator_export_2023-08-12.json',
                'Proton Authenticator_export_2025-08-11.json',
                'Proton Authenticator_export_2024-08-04.json',
            ];

            const result = sortBackupsByDate(filenames);
            expect(result).toEqual([
                'Proton Authenticator_export_2021-09-03.json',
                'Proton Authenticator_export_2023-08-12.json',
                'Proton Authenticator_export_2023-12-01.json',
                'Proton Authenticator_export_2024-08-04.json',
                'Proton Authenticator_export_2025-08-11.json',
                'Proton Authenticator_export_2025-12-02.json',
                'Proton Authenticator_export_2026-08-04.json',
            ]);
        });

        test('should be resilient against date extraction errors', () => {
            const filenames = [
                'Proton Authenticator_export_2023-12-01.json',
                'invalid_format.json',
                'Proton Authenticator_export_2021-09-03.json',
                'another_invalid.txt',
            ];

            const result = sortBackupsByDate(filenames);
            expect(result).toEqual([
                'Proton Authenticator_export_2021-09-03.json',
                'Proton Authenticator_export_2023-12-01.json',
            ]);
        });
    });

    describe('pruneExcessBackups', () => {
        const setupTestBackups = (total: number) => {
            const backups = Array.from(
                { length: total },
                (_, i) => `Proton Authenticator_export_2023-12-${String(i + 1).padStart(2, '0')}.json`
            );

            readDir.mockResolvedValueOnce(
                backups
                    .map((name) => ({
                        name,
                        isFile: true,
                        isDirectory: false,
                        isSymlink: false,
                    }))
                    .sort(() => Math.random()) // shuffle for testing
            );
        };

        test('should not delete anything when backup count is below limit', async () => {
            setupTestBackups(BACKUP_MAX_AMOUNT - 2);
            await pruneExcessBackups('/test/backup/dir');
            expect(remove).not.toHaveBeenCalled();
        });

        test('should not delete anything when backup count is at limit', async () => {
            setupTestBackups(BACKUP_MAX_AMOUNT);
            await pruneExcessBackups('/test/backup/dir');
            expect(remove).not.toHaveBeenCalled();
        });

        test('should delete oldest backup when count exceeds limit by one', async () => {
            setupTestBackups(BACKUP_MAX_AMOUNT + 1);
            await pruneExcessBackups('/test/backup/dir');
            expect(remove).toHaveBeenCalledTimes(1);
            expect(remove).toHaveBeenCalledWith('/test/backup/dir/Proton Authenticator_export_2023-12-01.json');
        });

        test('should delete multiple oldest backups when count exceeds limit', async () => {
            setupTestBackups(BACKUP_MAX_AMOUNT + 5);
            await pruneExcessBackups('/test/backup/dir');
            expect(remove).toHaveBeenCalledTimes(5);
            expect(remove).toHaveBeenCalledWith('/test/backup/dir/Proton Authenticator_export_2023-12-01.json');
            expect(remove).toHaveBeenCalledWith('/test/backup/dir/Proton Authenticator_export_2023-12-02.json');
            expect(remove).toHaveBeenCalledWith('/test/backup/dir/Proton Authenticator_export_2023-12-03.json');
            expect(remove).toHaveBeenCalledWith('/test/backup/dir/Proton Authenticator_export_2023-12-04.json');
            expect(remove).toHaveBeenCalledWith('/test/backup/dir/Proton Authenticator_export_2023-12-05.json');
        });

        test('should remove all backups if max=0', async () => {
            setupTestBackups(10);
            await pruneExcessBackups('/test/backup/dir', 0);
            expect(remove).toHaveBeenCalledTimes(10);
        });

        test('should handle empty backup directory', async () => {
            readDir.mockResolvedValueOnce([]);
            await pruneExcessBackups('/test/backup/dir');
            expect(remove).not.toHaveBeenCalled();
        });
    });
});
