import { describe, expect, it } from '@jest/globals';
import ExcelJS from 'exceljs';

import { convertXlsxToMarkdown, excelCellValueToCsvValue, getExcelSheetsFromFile } from './excelSheets';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLS_MIME_TYPE = 'application/vnd.ms-excel';

async function createWorkbookData(): Promise<ArrayBuffer> {
    const workbook = new ExcelJS.Workbook();
    const firstSheet = workbook.addWorksheet('Summary');
    firstSheet.addRow(['Name', 'Value']);
    firstSheet.addRow(['Alice', 10]);

    const secondSheet = workbook.addWorksheet('Details');
    secondSheet.addRow(['Item', 'Count']);
    secondSheet.addRow(['Widgets', 3]);

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
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
        expect(result.content).toContain('Sheet: Details');
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

    it('escapes CSV values produced from ExcelJS cell objects', async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Escaping');
        sheet.addRow([{ richText: [{ text: 'Hello, "quoted"' }] }, { formula: 'A1', result: 'Formula, result' }]);
        const data = await workbook.xlsx.writeBuffer();

        const result = await convertXlsxToMarkdown({
            name: 'escaping.xlsx',
            type: XLSX_MIME_TYPE,
            size: data.byteLength,
            data,
        });

        expect(result.content).toContain('"Hello, ""quoted"""');
        expect(result.content).toContain('"Formula, result"');
    });

    it('escapes all supported object cell value branches', () => {
        expect(excelCellValueToCsvValue({ richText: [{ text: 'Hello, "quoted"' }] })).toBe('"Hello, ""quoted"""');
        expect(excelCellValueToCsvValue({ text: 'Line 1\nLine 2' })).toBe('"Line 1\nLine 2"');
        expect(excelCellValueToCsvValue({ result: 'Formula, result' })).toBe('"Formula, result"');
        expect(excelCellValueToCsvValue({ toString: () => 'Value, with comma' })).toBe('"Value, with comma"');
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
