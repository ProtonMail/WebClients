import uniqueId from 'lodash/uniqueId';

import { prop } from '../../utils/fp/lens';
import { createTestItem } from '../../utils/tests/fixtures/items';
import { itemBuilder } from '../items/item.builder';
import { getDuplicatePasswords } from './monitor.utils';

const createMockItem = (password: string) =>
    createTestItem('login', {
        itemId: uniqueId(),
        data: itemBuilder('login').set('content', (content) => content.set('password', password)).data,
    });

describe('getDuplicatePasswords', () => {
    test('should correctly identify and return duplicate passwords', () => {
        const items = [
            ...Array.from({ length: 5 }, () => createMockItem('AAA')),
            ...Array.from({ length: 2 }, () => createMockItem('BBB')),
            ...Array.from({ length: 5 }, () => createMockItem(uniqueId())),
            // nosemgrep: rules_lgpl_javascript_crypto_rule-node-insecure-random-generator -- shuffles test input, no security use
        ].sort(() => Math.random() - 0.5); /* shuffle the array */

        const duplicates = getDuplicatePasswords(items).sort((a, b) => b.length - a.length);
        expect(duplicates.length).toEqual(2);
        expect(duplicates[0].length).toEqual(5);
        expect(duplicates[1].length).toEqual(2);
        expect(new Set(duplicates[0].map(prop('itemId'))).size).toEqual(5);
        expect(new Set(duplicates[1].map(prop('itemId'))).size).toEqual(2);
    });

    test('should handle case where there are no duplicates', () => {
        const items = Array.from({ length: 10 }, () => createMockItem(uniqueId()));
        const duplicates = getDuplicatePasswords(items).sort((a, b) => b.length - a.length);
        expect(duplicates.length).toEqual(0);
    });

    test('should handle case when there are no logins', () => {
        expect(getDuplicatePasswords([])).toEqual([]);
    });

    test.each([100, 1000, 10_000])('Performance test for %i items', (count) => {
        const items = Array.from({ length: count }, () => createMockItem('AAA'));

        const startTime = process.hrtime();
        const duplicates = getDuplicatePasswords(items);
        const endTime = process.hrtime(startTime);
        const executionTimeMs = (endTime[0] * 1e9 + endTime[1]) / 1e6;

        /* We are fine as long as calculation is under 0.2s */
        expect(executionTimeMs).toBeLessThanOrEqual(200);
        expect(duplicates).toBeDefined();
    });
});
