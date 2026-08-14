import { describe, expect, it } from '@jest/globals';

import {
    extractSpreadsheetTableSections,
    getPrimarySpreadsheetTableCsv,
    parseCSVContent,
} from './spreadsheetTableContent';

describe('spreadsheetTableContent', () => {
    it('parses plain CSV rows', () => {
        expect(parseCSVContent('id,age,count\n23,4,23')).toEqual([
            ['id', 'age', 'count'],
            ['23', '4', '23'],
        ]);
    });

    it('extracts CSV from markdown sheet blocks', () => {
        const content = [
            'Sheet: Sheet1',
            '```csv',
            'id,age,count,on',
            '23,4,23,2',
            '```',
        ].join('\n');

        expect(getPrimarySpreadsheetTableCsv(content)).toBe('id,age,count,on\n23,4,23,2');
        expect(parseCSVContent(getPrimarySpreadsheetTableCsv(content))).toEqual([
            ['id', 'age', 'count', 'on'],
            ['23', '4', '23', '2'],
        ]);
    });

    it('extracts multiple sheet sections', () => {
        const content = [
            'Sheet: Summary',
            '```csv',
            'Name,Value',
            'Alice,10',
            '```',
            '',
            'Sheet: Details',
            '```csv',
            'Item,Count',
            'Widgets,3',
            '```',
        ].join('\n');

        expect(extractSpreadsheetTableSections(content)).toEqual([
            { title: 'Summary', csv: 'Name,Value\nAlice,10' },
            { title: 'Details', csv: 'Item,Count\nWidgets,3' },
        ]);
    });
});
