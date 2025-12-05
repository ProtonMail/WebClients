import { PandocConverter } from '../lib/attachments/pandoc-wasm';
import pdfParse from '../lib/attachments/pdfParse';
import { isFileTypeSupported } from '../util/filetypes';
import { mimeTypeToPandocFormat, needsPandocConversion, shouldProcessAsPlainText } from '../util/mimetype';

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
    }
};

export interface FileData {
    name: string;
    type: string;
    size: number;
    data: ArrayBuffer;
}

export interface FileProcessingRequest {
    id: string;
    file: FileData;
    isLumoPaid?: boolean; // User tier information for tiered processing limits
}

export interface TextProcessingResult {
    id: string;
    type: 'text';
    content: string;
    metadata?: {
        truncated?: boolean;
        rowCount?: { original: number; processed: number };
    };
}

export interface ImageProcessingResult {
    id: string;
    type: 'image';
    originalSize: number;
    processedSize: number;
    processedData: ArrayBuffer;
}

export interface ProcessingError {
    id: string;
    type: 'error';
    message: string;
    unsupported?: boolean;
}

export type FileProcessingResponse = TextProcessingResult | ImageProcessingResult | ProcessingError;

interface RowMetadata {
    original: number;
    processed: number;
}

interface ProcessedContent {
    content: string;
    rowCount?: RowMetadata;
}

interface InternalProcessingResult {
    content: string;
    metadata?: {
        rowCount?: RowMetadata;
    };
}

interface ProcessedImage {
    originalSize: number;
    processedSize: number;
    processedData: ArrayBuffer;
}

interface InternalTextResult {
    type: 'text';
    data: InternalProcessingResult;
}

interface InternalImageResult {
    type: 'image';
    data: ProcessedImage;
}

interface InternalUnsupportedResult {
    type: 'unsupported';
}

type InternalFileResult = InternalTextResult | InternalImageResult | InternalUnsupportedResult;

interface TruncationResult {
    content: string;
    wasTruncated: boolean;
}

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
        worksheet.eachRow((row, rowNumber) => {
            // ExcelJS row.values is an array where index 0 is empty, actual values start at index 1
            const rowValues = row.values as any[];
            const csvRow = rowValues
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
            csvRows.push(csvRow);
        });

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
        data: { content: truncatedContent },
    };
}

function processCsvFile(fileData: FileData): InternalTextResult {
    const csvContent = new TextDecoder('utf-8').decode(fileData.data);
    const lines = csvContent.split('\n');
    const { content: truncatedContent, wasTruncated } = truncateContent(csvContent);

    return {
        type: 'text',
        data: {
            content: truncatedContent,
            metadata: {
                rowCount: {
                    original: lines.length,
                    processed: wasTruncated
                        ? Math.floor(lines.length * (truncatedContent.length / csvContent.length))
                        : lines.length,
                },
            },
        },
    };
}

async function processPdfFile(fileData: FileData): Promise<InternalTextResult> {
    const parseResult = await pdfParse(fileData.data);
    return {
        type: 'text',
        data: { content: parseResult.text },
    };
}

async function processExcelFile(fileData: FileData): Promise<InternalTextResult> {
    const csvData = await convertXlsxToCsv(fileData);
    const lines = csvData.split('\n');
    const { content: truncatedContent, wasTruncated } = truncateContent(csvData);

    return {
        type: 'text',
        data: {
            content: truncatedContent,
            metadata: {
                rowCount: {
                    original: lines.length,
                    processed: wasTruncated
                        ? Math.floor(lines.length * (truncatedContent.length / csvData.length))
                        : lines.length,
                },
            },
        },
    };
}

async function reduceImageSize(fileData: FileData): Promise<ArrayBuffer> {
    // TODO: Implement actual image compression/resizing
    // For now, this is an identity function that returns the original data
    console.log(`[Image Processing] Reducing image size for ${fileData.name} (placeholder - no actual reduction yet)`);
    return fileData.data;
}

async function processImageFile(fileData: FileData): Promise<InternalImageResult> {
    console.log(`Processing image: ${fileData.name} (${fileData.type})`);

    const processedData = await reduceImageSize(fileData);

    return {
        type: 'image',
        data: {
            originalSize: fileData.size,
            processedSize: processedData.byteLength,
            processedData,
        },
    };
}

async function processFile(fileData: FileData, isLumoPaid: boolean = false): Promise<InternalFileResult> {
    const startTime = performance.now();
    console.log(`[Performance] Starting processing for ${fileData.name} (${fileData.type})`);

    validateFileSize(fileData, isLumoPaid);

    try {
        switch (fileData.type) {
            case 'text/plain':
                return processTextFile(fileData);

            case 'text/csv':
                return processCsvFile(fileData);

            case 'application/pdf':
                return await processPdfFile(fileData);

            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.ms-excel':
                return await processExcelFile(fileData);

            case 'image/jpeg':
            case 'image/jpg':
            case 'image/png':
            case 'image/gif':
            case 'image/webp':
            case 'image/heic':
            case 'image/heif':
                return await processImageFile(fileData);

            default: {
                if (shouldProcessAsPlainText(fileData.type) ||
                    (fileData.type === '' && isFileTypeSupported(fileData.name))) {
                    return processTextFile(fileData);
                }

                if (needsPandocConversion(fileData.type)) {
                    const pandocFormat = mimeTypeToPandocFormat(fileData.type);
                    if (pandocFormat) {
                        return await processWithPandoc(fileData, pandocFormat);
                    }
                }

                return { type: 'unsupported' };
            }
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
        data: { content: converted },
    };
}

// Handle messages from the main thread
self.addEventListener('message', async (event: MessageEvent<FileProcessingRequest>) => {
    const { id, file, isLumoPaid = false } = event.data;

    try {
        const result = await processFile(file, isLumoPaid);

        if (result.type === 'unsupported') {
            const response: ProcessingError = {
                id,
                type: 'error',
                message: `Unsupported file type: ${file.type}`,
                unsupported: true,
            };
            self.postMessage(response);
        } else if (result.type === 'image') {
            const response: ImageProcessingResult = {
                id,
                type: 'image',
                originalSize: result.data.originalSize,
                processedSize: result.data.processedSize,
                processedData: result.data.processedData,
            };
            self.postMessage(response);
        } else if (result.type === 'text') {
            const response: TextProcessingResult = {
                id,
                type: 'text',
                content: result.data.content,
                metadata: result.data.metadata?.rowCount
                    ? { truncated: result.data.content.includes('Content truncated'), rowCount: result.data.metadata.rowCount }
                    : undefined,
            };
            self.postMessage(response);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const response: ProcessingError = {
            id,
            type: 'error',
            message: errorMessage,
        };
        self.postMessage(response);
    }
});

// Handle worker cleanup
self.addEventListener('beforeunload', async () => {
    if (pandocConverter) {
        await pandocConverter.cleanup();
    }
});
