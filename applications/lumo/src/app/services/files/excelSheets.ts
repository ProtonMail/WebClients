import * as XLSX from 'xlsx';

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

function isZipArchive(data: ArrayBuffer): boolean {
    const view = new Uint8Array(data);
    return view.length >= 4 && view[0] === 0x50 && view[1] === 0x4b;
}

function readWorkbook(data: ArrayBuffer, name: string, type?: string): XLSX.WorkBook {
    if (isLegacyExcelFile(name, type)) {
        throw createExcelReadError(name, type, new Error('Legacy .xls workbook'));
    }

    if (!isZipArchive(data)) {
        throw createExcelReadError(name, type, new Error('Not a zip archive'));
    }

    try {
        return XLSX.read(new Uint8Array(data), { type: 'array', cellDates: true });
    } catch (error) {
        throw createExcelReadError(name, type, error);
    }
}

function getSheetRowCount(sheet: XLSX.WorkSheet): number {
    const ref = sheet['!ref'];
    if (!ref) {
        return 0;
    }

    const range = XLSX.utils.decode_range(ref);
    return range.e.r - range.s.r + 1;
}

function sheetToCsvRows(sheet: XLSX.WorkSheet): string[] {
    const csvContent = XLSX.utils.sheet_to_csv(sheet);
    if (!csvContent) {
        return [];
    }

    return csvContent.split('\n');
}

export async function getExcelSheetsFromFileData(fileData: FileData): Promise<ExcelSheetInfo[]> {
    const workbook = readWorkbook(fileData.data, fileData.name, fileData.type);

    return workbook.SheetNames.map((name, index) => ({
        index: index + 1,
        name,
        rowCount: getSheetRowCount(workbook.Sheets[name]),
    }));
}

export async function getExcelSheetsFromFile(file: File): Promise<ExcelSheetInfo[]> {
    const data = await file.arrayBuffer();
    return getExcelSheetsFromFileData({
        name: file.name,
        type: file.type,
        size: file.size,
        data,
    });
}

export async function convertXlsxToMarkdown(
    fileData: FileData,
    selectedSheetNames?: string[]
): Promise<ExcelConversionResult> {
    const workbook = readWorkbook(fileData.data, fileData.name, fileData.type);
    const selectedSheetNameSet = selectedSheetNames?.length ? new Set(selectedSheetNames) : undefined;
    const sheetNames = workbook.SheetNames.filter((name) => !selectedSheetNameSet || selectedSheetNameSet.has(name));

    if (!workbook.SheetNames.length) {
        throw new Error('Excel file contains no worksheets');
    }

    if (!sheetNames.length) {
        throw new Error('No Excel worksheets selected');
    }

    const includeSheetHeaders = sheetNames.length > 1;
    let totalRows = 0;
    const sheetBlocks = sheetNames.map((sheetName) => {
        const csvRows = sheetToCsvRows(workbook.Sheets[sheetName]);
        totalRows += csvRows.length;

        const csvContent = csvRows.join('\n');
        if (!includeSheetHeaders) {
            return csvContent;
        }

        return [`Sheet: ${sheetName}`, '```csv', csvContent, '```'].join('\n');
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
