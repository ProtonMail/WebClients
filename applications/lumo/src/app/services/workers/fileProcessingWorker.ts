import type { Row } from 'exceljs';

import { PandocConverter } from '../../lib/attachments/pandoc-wasm';
import pdfParse from '../../lib/attachments/pdfParse';
import { getProcessingCategory, mimeTypeToPandocFormat } from '../../util/filetypes';
import type {
    FileData,
    FileProcessingRequest,
    FileProcessingResponse,
    ProcessingError,
} from '../fileProcessingService';
import type { InternalFileResult, InternalTextResult, TruncationResult } from '../files/types';

// Safe logger for worker context (avoids console.warn/console.error that are forbidden in tests)
const workerLogger = {
    log: (message: string, ...args: any[]) => {
        console.log(`[WORKER] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        console.log(`[WORKER-WARN] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
        console.log(`[WORKER-ERROR] ${message}`, ...args);
    },
};

let pandocConverter: PandocConverter | null = null;

function truncateContent(content: string, maxChars: number = 500000): TruncationResult {
    if (content.length <= maxChars) {
        return { content, wasTruncated: false };
    }

    console.log(`[Performance] Truncating content from ${content.length} to ${maxChars} characters`);

    const truncated = content.substring(0, maxChars);
    const truncatedWithNotice = truncated + '\n\n--- Content truncated due to size limitations ---';

    return {
        content: truncatedWithNotice,
        wasTruncated: true,
    };
}

async function getPandocConverter(): Promise<PandocConverter> {
    if (!pandocConverter) {
        pandocConverter = new PandocConverter();
        await pandocConverter.ready;
    }
    return pandocConverter;
}

function rowToCommaSeparatedString(row: Row): string {
    // ExcelJS row.values is an array where index 0 is empty, actual values start at index 1
    const rowValues = row.values as any[];
    return rowValues
        .slice(1)
        .map((value: any) => {
            // Handle different cell value types
            if (value === null || value === undefined) {
                return '';
            }
            // Handle ExcelJS cell objects with rich text or formulas
            if (typeof value === 'object' && value !== null) {
                if (value.richText) {
                    // Handle rich text cells
                    return value.richText.map((rt: any) => rt.text || '').join('');
                } else if (value.text !== undefined) {
                    // Handle simple text cells
                    return String(value.text);
                } else if (value.result !== undefined) {
                    // Handle formula cells
                    return String(value.result);
                } else {
                    // Handle other object types
                    return String(value);
                }
            }
            const stringValue = String(value);
            // Escape commas and quotes in CSV
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        })
        .join(',');
}

async function convertXlsxToCsv(fileData: FileData): Promise<string> {
    try {
        console.log(`Converting Excel file: ${fileData.name} (${(fileData.size / 1024 / 1024).toFixed(2)} MB)`);

        // Import exceljs library dynamically
        const ExcelJS = await import('exceljs');

        // Read the Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileData.data);

        // Get the first worksheet
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new Error('Excel file contains no worksheets');
        }

        // Convert the worksheet to CSV format
        const csvRows: string[] = [];
        worksheet.eachRow((row) => csvRows.push(rowToCommaSeparatedString(row)));

        const csvData = csvRows.join('\n');
        if (!csvData.trim()) {
            throw new Error('Excel file appears to be empty or contains no readable data');
        }

        const lines = csvData.split('\n');
        console.log(`Excel file converted: ${lines.length} rows`);
        return csvData;
    } catch (error) {
        workerLogger.error('Error converting Excel to CSV:', error);
        throw error instanceof Error ? error : new Error('Failed to convert Excel file to CSV');
    }
}

function validateFileSize(fileData: FileData, isLumoPaid: boolean): void {
    const BASE_LIMITS: Record<string, number> = {
        'text/plain': 50,
        'text/csv': 100,
        'application/pdf': 200,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 150,
        'application/vnd.ms-excel': 150,
        default: 50,
    };

    const tierMultiplier = isLumoPaid ? 2 : 1;
    const baseSizeLimit = BASE_LIMITS[fileData.type] || BASE_LIMITS.default;
    const sizeLimit = baseSizeLimit * tierMultiplier;
    const fileSizeMB = fileData.size / (1024 * 1024);

    if (fileSizeMB > sizeLimit) {
        throw new Error(`File too large: ${fileSizeMB.toFixed(1)}MB exceeds ${sizeLimit}MB limit`);
    }
}

function processTextFile(fileData: FileData): InternalTextResult {
    const content = new TextDecoder('utf-8').decode(fileData.data);
    const { content: truncatedContent } = truncateContent(content);
    return {
        type: 'text',
        content: truncatedContent,
    };
}

function processCsvFile(fileData: FileData): InternalTextResult {
    const csvContent = new TextDecoder('utf-8').decode(fileData.data);
    const lines = csvContent.split('\n');
    const { content: truncatedContent, wasTruncated } = truncateContent(csvContent);

    return {
        type: 'text',
        content: truncatedContent,
        metadata: {
            rowCount: {
                original: lines.length,
                processed: wasTruncated
                    ? Math.floor(lines.length * (truncatedContent.length / csvContent.length))
                    : lines.length,
            },
        },
    };
}

async function processPdfFile(fileData: FileData): Promise<InternalTextResult> {
    try {
        const parseResult = await pdfParse(fileData.data);
        
        if (!parseResult || !parseResult.text) {
            throw new Error('PDF parsing returned empty result');
        }
        
        return {
            type: 'text',
            content: parseResult.text,
        };
    } catch (error) {
        workerLogger.error(`PDF parsing failed for ${fileData.name}:`, error);
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function processExcelFile(fileData: FileData): Promise<InternalTextResult> {
    const csvData = await convertXlsxToCsv(fileData);
    const lines = csvData.split('\n');
    const { content: truncatedContent, wasTruncated } = truncateContent(csvData);

    return {
        type: 'text',
        content: truncatedContent,
        metadata: {
            rowCount: {
                original: lines.length,
                processed: wasTruncated
                    ? Math.floor(lines.length * (truncatedContent.length / csvData.length))
                    : lines.length,
            },
        },
    };
}

async function processFile(fileData: FileData, isLumoPaid: boolean = false): Promise<InternalFileResult> {
    const startTime = performance.now();
    console.log(`[Performance] Starting processing for ${fileData.name} (${fileData.type})`);

    validateFileSize(fileData, isLumoPaid);

    try {
        const category = getProcessingCategory(fileData.type, fileData.name);

        switch (category) {
            case 'text':
                return processTextFile(fileData);

            case 'csv':
                return processCsvFile(fileData);

            case 'excel':
                return await processExcelFile(fileData);

            case 'pdf':
                return await processPdfFile(fileData);

            case 'document': {
                const pandocFormat = mimeTypeToPandocFormat(fileData.type);
                if (pandocFormat) {
                    return await processWithPandoc(fileData, pandocFormat);
                }
                return {
                    type: 'error',
                    message: `Unsupported document format: ${fileData.type}`,
                    unsupported: true,
                };
            }

            case 'image':
                return {
                    type: 'error',
                    message: `Images must be processed on the main thread`,
                    unsupported: false,
                };

            case 'unsupported':
                return {
                    type: 'error',
                    message: `Unsupported file type: ${fileData.type}`,
                    unsupported: true,
                };
        }
    } catch (error) {
        workerLogger.error(`Error processing ${fileData.name}:`, error);
        throw error instanceof Error ? error : new Error(String(error));
    } finally {
        const duration = performance.now() - startTime;
        console.log(`[Performance] Completed ${fileData.name} in ${duration.toFixed(2)}ms`);
    }
}

async function processWithPandoc(fileData: FileData, inputFormat: string): Promise<InternalTextResult> {
    const pandoc = await getPandocConverter();
    const converted = await pandoc.convert(fileData.data, inputFormat);

    if (!converted || converted.trim() === '') {
        throw new Error(`Pandoc conversion produced empty output for ${fileData.type}`);
    }

    return {
        type: 'text',
        content: converted,
    };
}

const sendResponse = (response: FileProcessingResponse) => {
    self.postMessage(response);
};

// Handle messages from the main thread
self.addEventListener('message', async (event: MessageEvent<FileProcessingRequest | { type: 'cleanup' }>) => {
    // Handle cleanup message
    if ('type' in event.data && event.data.type === 'cleanup') {
        if (pandocConverter) {
            await pandocConverter.cleanup();
            pandocConverter = null;
        }
        return;
    }

    const { id, file, isLumoPaid = false } = event.data as FileProcessingRequest;

    try {
        const result = await processFile(file, isLumoPaid);

        // Add id to result and send
        const response: FileProcessingResponse = { id, ...result };

        // For text results, compute truncated flag if not already set
        if (response.type === 'text' && response.metadata && !('truncated' in response.metadata)) {
            response.metadata.truncated = response.content.includes('Content truncated');
        }

        sendResponse(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const response: ProcessingError = {
            id,
            type: 'error',
            message: errorMessage,
        };
        sendResponse(response);
    }
});
