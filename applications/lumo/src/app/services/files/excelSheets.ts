import type { Row, Worksheet } from 'exceljs';

import type { FileData } from '../fileProcessingService';

export type ExcelSheetInfo = {
    index: number;
    name: string;
    rowCount: number;
};

export type ExcelConversionResult = {
    content: string;
    rowCount: number;
};

export const getExcelSheetFileName = (fileName: string, sheetName: string) => {
    const sanitizedSheetName = sheetName.replace(/[\\/:*?"<>|]/g, '-').trim() || 'Sheet';
    const extensionIndex = fileName.lastIndexOf('.');

    if (extensionIndex <= 0) {
        return `${fileName} - ${sanitizedSheetName}`;
    }

    return `${fileName.slice(0, extensionIndex)} - ${sanitizedSheetName}${fileName.slice(extensionIndex)}`;
};

export const createExcelSheetFile = (file: File, sheetName: string) => {
    return new File([file], getExcelSheetFileName(file.name, sheetName), {
        type: file.type,
        lastModified: file.lastModified,
    });
};

function isLegacyExcelFile(name: string, type?: string): boolean {
    return name.toLowerCase().endsWith('.xls') || type === 'application/vnd.ms-excel';
}

function createExcelReadError(name: string, type: string | undefined, error: unknown): Error {
    if (isLegacyExcelFile(name, type)) {
        return new Error(
            'Legacy Excel .xls files are not supported. Please save the workbook as .xlsx or CSV and try again.'
        );
    }

    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to read Excel workbook "${name}": ${message}`);

    return new Error(
        'We could not read this Excel workbook. It may be encrypted, corrupted, or not a valid .xlsx file. Please save it as .xlsx or CSV and try again.'
    );
}

function escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function getObjectCellText(value: any): string {
    if (value.richText) {
        return value.richText.map((rt: any) => rt.text || '').join('');
    }
    if (value.text !== undefined) {
        return String(value.text);
    }
    if (value.result !== undefined) {
        return String(value.result);
    }

    const serializedValue = String(value);
    try {
        const parsedValue = JSON.parse(serializedValue);
        if (parsedValue?.richText) {
            return parsedValue.richText.map((rt: any) => rt.text || '').join('');
        }
        if (parsedValue?.text !== undefined) {
            return String(parsedValue.text);
        }
        if (parsedValue?.result !== undefined) {
            return String(parsedValue.result);
        }
    } catch {
        // Some ExcelJS value objects stringify to JSON; otherwise use the serialized form.
    }

    return serializedValue;
}

export function excelCellValueToCsvValue(value: any): string {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'object') {
        return escapeCsvValue(getObjectCellText(value));
    }

    return escapeCsvValue(String(value));
}

function rowToCommaSeparatedString(row: Row): string {
    // ExcelJS row.values is an array where index 0 is empty, actual values start at index 1.
    const rowValues = row.values as any[];
    return rowValues
        .slice(1)
        .map((value: any) => excelCellValueToCsvValue(value))
        .join(',');
}

function worksheetToCsvRows(worksheet: Worksheet): string[] {
    const csvRows: string[] = [];
    worksheet.eachRow((row) => csvRows.push(rowToCommaSeparatedString(row)));
    return csvRows;
}

async function readWorkbook(data: ArrayBuffer, name: string, type?: string) {
    if (isLegacyExcelFile(name, type)) {
        throw createExcelReadError(name, type, new Error('Legacy .xls workbook'));
    }

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.load(data);
    } catch (error) {
        throw createExcelReadError(name, type, error);
    }

    return workbook;
}

export async function getExcelSheetsFromFile(file: File): Promise<ExcelSheetInfo[]> {
    const workbook = await readWorkbook(await file.arrayBuffer(), file.name, file.type);

    return workbook.worksheets.map((worksheet, index) => ({
        index: index + 1,
        name: worksheet.name,
        rowCount: worksheet.actualRowCount,
    }));
}

export async function convertXlsxToMarkdown(
    fileData: FileData,
    selectedSheetNames?: string[]
): Promise<ExcelConversionResult> {
    const workbook = await readWorkbook(fileData.data, fileData.name, fileData.type);
    const selectedSheetNameSet = selectedSheetNames?.length ? new Set(selectedSheetNames) : undefined;
    const worksheets = workbook.worksheets.filter(
        (worksheet) => !selectedSheetNameSet || selectedSheetNameSet.has(worksheet.name)
    );

    if (!workbook.worksheets.length) {
        throw new Error('Excel file contains no worksheets');
    }

    if (!worksheets.length) {
        throw new Error('No Excel worksheets selected');
    }

    const includeSheetHeaders = workbook.worksheets.length > 1;
    let totalRows = 0;
    const sheetBlocks = worksheets.map((worksheet) => {
        const csvRows = worksheetToCsvRows(worksheet);
        totalRows += csvRows.length;

        if (!includeSheetHeaders) {
            return csvRows.join('\n');
        }

        return [`Sheet: ${worksheet.name}`, '```csv', csvRows.join('\n'), '```'].join('\n');
    });

    const content = sheetBlocks.join('\n\n').trim();
    if (!content) {
        throw new Error('Excel file appears to be empty or contains no readable data');
    }

    return {
        content,
        rowCount: totalRows,
    };
}
