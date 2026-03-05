import { CONTENT_VERSION } from '../../esBuild';
import type { MigrationMethod } from '../interface';
import { getMigrationToRun } from './getMigrationToRun';

describe('getMigrationToRun', () => {
    it('should return list of migrations to run for content of version -1', () => {
        const migrationArray: MigrationMethod[] = [
            { targetVersion: 1, fn: jest.fn() },
            { targetVersion: 2, fn: jest.fn() },
            { targetVersion: 3, fn: jest.fn() },
        ];

        const result = getMigrationToRun(-1 as CONTENT_VERSION, migrationArray);
        expect(result.length).toBe(3);

        const versions = result.map((m) => m.targetVersion);
        expect(versions).toEqual([1, 2, 3]);
    });

    it('should return list of migrations to run for content of version 1', () => {
        const migrationArray: MigrationMethod[] = [
            { targetVersion: 1, fn: jest.fn() },
            { targetVersion: 2, fn: jest.fn() },
            { targetVersion: 3, fn: jest.fn() },
        ];

        const result = getMigrationToRun(CONTENT_VERSION.V1, migrationArray);
        expect(result.length).toBe(2);

        const versions = result.map((m) => m.targetVersion);
        expect(versions).toEqual([2, 3]);
    });

    it('should return list of migrations to run for content of version 2', () => {
        const migrationArray: MigrationMethod[] = [
            { targetVersion: 1, fn: jest.fn() },
            { targetVersion: 2, fn: jest.fn() },
            { targetVersion: 3, fn: jest.fn() },
        ];

        const result = getMigrationToRun(CONTENT_VERSION.DOM_INDEXING, migrationArray);
        expect(result.length).toBe(1);

        const versions = result.map((m) => m.targetVersion);
        expect(versions).toEqual([3]);
    });

    it('should return list of migrations to run for content of version 3', () => {
        const migrationArray: MigrationMethod[] = [
            { targetVersion: 1, fn: jest.fn() },
            { targetVersion: 2, fn: jest.fn() },
            { targetVersion: 3, fn: jest.fn() },
        ];

        const result = getMigrationToRun(CONTENT_VERSION.BLOCKQUOTE_FIX, migrationArray);
        expect(result.length).toBe(0);
    });

    it('should not be impacted by the order of the migrations', () => {
        const migrationArray: MigrationMethod[] = [
            { targetVersion: 3, fn: jest.fn() },
            { targetVersion: 1, fn: jest.fn() },
            { targetVersion: 2, fn: jest.fn() },
        ];

        const result = getMigrationToRun(CONTENT_VERSION.V1, migrationArray);
        expect(result.length).toBe(2);

        const versions = result.map((m) => m.targetVersion);
        expect(versions).toEqual([2, 3]);
    });
});
