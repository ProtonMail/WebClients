import { describe, expect, it } from '@jest/globals';
import * as XLSX from 'xlsx';

import { convertXlsxToMarkdown, getExcelSheetsFromFile } from './excelSheets';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLS_MIME_TYPE = 'application/vnd.ms-excel';

async function createWorkbookData(): Promise<ArrayBuffer> {
    const workbook = XLSX.utils.book_new();
    const firstSheet = XLSX.utils.aoa_to_sheet([
        ['Name', 'Value'],
        ['Alice', 10],
    ]);
    XLSX.utils.book_append_sheet(workbook, firstSheet, 'Summary');

    const secondSheet = XLSX.utils.aoa_to_sheet([
        ['Item', 'Count'],
        ['Widgets', 3],
    ]);
    XLSX.utils.book_append_sheet(workbook, secondSheet, 'Details');

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    return buffer;
}

async function createGoogleSheetsLikeWorkbookData(): Promise<ArrayBuffer> {
    const workbook = XLSX.utils.book_new();
    const firstSheet = XLSX.utils.aoa_to_sheet([
        ['Col A', 'Col B', 'Col C', 'Col D'],
        [23, 4, 23, 2],
        [22, 33, 33, 33],
    ]);
    XLSX.utils.book_append_sheet(workbook, firstSheet, 'Sheet1');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), 'Sheet2');

    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

describe('excelSheets', () => {
    it('reads sheet names and row counts from a workbook', async () => {
        const data = await createWorkbookData();
        const file = new File([data], 'report.xlsx', { type: XLSX_MIME_TYPE });

        const sheets = await getExcelSheetsFromFile(file);

        expect(sheets).toEqual([
            { index: 1, name: 'Summary', rowCount: 2 },
            { index: 2, name: 'Details', rowCount: 2 },
        ]);
    });

    it('converts all sheets into labeled context by default', async () => {
        const data = await createWorkbookData();

        const result = await convertXlsxToMarkdown({
            name: 'report.xlsx',
            type: XLSX_MIME_TYPE,
            size: data.byteLength,
            data,
        });

        expect(result.rowCount).toBe(4);
        expect(result.content).toContain('Sheet: Summary');
        expect(result.content).toContain('Name,Value');
        expect(result.content).toContain('Alice,10');
        expect(result.content).toContain('Sheet: Details');
        expect(result.content).toContain('Widgets,3');
    });

    it('converts only the selected sheets when sheet names are provided', async () => {
        const data = await createWorkbookData();

        const result = await convertXlsxToMarkdown(
            {
                name: 'report.xlsx',
                type: XLSX_MIME_TYPE,
                size: data.byteLength,
                data,
            },
            ['Details']
        );

        expect(result.rowCount).toBe(2);
        expect(result.content).not.toContain('Sheet: Summary');
        expect(result.content).not.toContain('```csv');
        expect(result.content).toContain('Item,Count');
        expect(result.content).toContain('Widgets,3');
    });

    it('treats an empty selected sheets array as no sheet filter', async () => {
        const data = await createWorkbookData();

        const result = await convertXlsxToMarkdown(
            {
                name: 'report.xlsx',
                type: XLSX_MIME_TYPE,
                size: data.byteLength,
                data,
            },
            []
        );

        expect(result.rowCount).toBe(4);
        expect(result.content).toContain('Sheet: Summary');
        expect(result.content).toContain('Sheet: Details');
    });

    it('escapes CSV values with commas and quotes', async () => {
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet([['Hello, "quoted"', 'Formula, result']]);
        XLSX.utils.book_append_sheet(workbook, sheet, 'Escaping');
        const data = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

        const result = await convertXlsxToMarkdown({
            name: 'escaping.xlsx',
            type: XLSX_MIME_TYPE,
            size: data.byteLength,
            data,
        });

        expect(result.content).toContain('"Hello, ""quoted"""');
        expect(result.content).toContain('"Formula, result"');
    });

    it('handles Google Sheets-style workbooks with an empty second sheet', async () => {
        const data = await createGoogleSheetsLikeWorkbookData();

        const result = await convertXlsxToMarkdown(
            {
                name: 'Untitled spreadsheet.xlsx',
                type: XLSX_MIME_TYPE,
                size: data.byteLength,
                data,
            },
            ['Sheet1']
        );

        expect(result.rowCount).toBe(3);
        expect(result.content).not.toContain('```csv');
        expect(result.content).toContain('Col A,Col B,Col C,Col D');
        expect(result.content).toContain('22,33,33,33');
    });

    it('returns a readable error for unreadable xlsx files', async () => {
        const data = new TextEncoder().encode('not an xlsx file').buffer;

        await expect(
            convertXlsxToMarkdown({
                name: 'broken.xlsx',
                type: XLSX_MIME_TYPE,
                size: data.byteLength,
                data,
            })
        ).rejects.toThrow(
            'We could not read this Excel workbook. It may be encrypted, corrupted, or not a valid .xlsx file. Please save it as .xlsx or CSV and try again.'
        );
    });

    it('returns a readable error for legacy xls files', async () => {
        const data = new ArrayBuffer(0);

        await expect(
            convertXlsxToMarkdown({
                name: 'legacy.xls',
                type: XLS_MIME_TYPE,
                size: data.byteLength,
                data,
            })
        ).rejects.toThrow(
            'Legacy Excel .xls files are not supported. Please save the workbook as .xlsx or CSV and try again.'
        );
    });
});
