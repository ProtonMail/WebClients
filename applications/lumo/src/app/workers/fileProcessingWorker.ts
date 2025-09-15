import { PandocConverter } from '../lib/attachments/pandoc-wasm';
import pdfParse from '../lib/attachments/pdfParse';
import { isFileTypeSupported } from '../util/filetypes';
import { mimeTypeToPandocFormat, needsPandocConversion, shouldProcessAsPlainText } from '../util/mimetype';

export interface FileProcessingRequest {
    id: string;
    file: {
        name: string;
        type: string;
        size: number;
        data: ArrayBuffer;
    };
}

export interface FileProcessingResponse {
    id: string;
    success: boolean;
    result?: {
        originalContent: string;
        convertedContent: string;
        originalSize: number;
        convertedSize: number;
        truncated?: boolean;
        originalRowCount?: number;
        processedRowCount?: number;
    };
    error?: string;
    isUnsupported?: boolean;
}

let pandocConverter: PandocConverter | null = null;

// Performance optimization: Content truncation to prevent memory issues
function truncateContent(content: string, maxChars: number = 500000): { content: string; wasTruncated: boolean } {
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

async function convertXlsxToCsv(fileData: FileProcessingRequest['file']): Promise<string> {
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
        console.error('Error converting Excel to CSV:', error);
        throw error instanceof Error ? error : new Error('Failed to convert Excel file to CSV');
    }
}

async function processFile(fileData: FileProcessingRequest['file']): Promise<FileProcessingResponse['result'] | null> {
    const startTime = performance.now();
    const fileSizeMB = fileData.size / (1024 * 1024);
    console.log(
        `[Performance] Starting processing for ${fileData.name} (${fileData.type}, ${fileSizeMB.toFixed(2)}MB)`
    );

    // Performance optimization: Set size limits for different file types
    const SIZE_LIMITS = {
        'text/plain': 50, // 50MB
        'text/csv': 100, // 100MB
        'application/pdf': 200, // 200MB
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 150, // 150MB
        'application/vnd.ms-excel': 150, // 150MB
        default: 50, // 50MB for other types
    };

    const sizeLimit = SIZE_LIMITS[fileData.type as keyof typeof SIZE_LIMITS] || SIZE_LIMITS.default;

    if (fileSizeMB > sizeLimit) {
        console.warn(
            `[Performance] File ${fileData.name} (${fileSizeMB.toFixed(2)}MB) exceeds size limit (${sizeLimit}MB)`
        );
        throw new Error(`File too large: ${fileSizeMB.toFixed(1)}MB exceeds ${sizeLimit}MB limit for ${fileData.type}`);
    }

    try {
        switch (fileData.type) {
            case 'text/plain': {
                const converted = new TextDecoder('utf-8').decode(fileData.data);
                const truncated = truncateContent(converted);
                return {
                    originalContent: converted,
                    convertedContent: truncated.content,
                    originalSize: converted.length,
                    convertedSize: truncated.content.length,
                    truncated: truncated.wasTruncated,
                };
            }

            case 'text/csv': {
                // Direct CSV processing - no need for Pandoc conversion
                console.log(`Processing CSV file: ${fileData.name} (${(fileData.size / 1024 / 1024).toFixed(2)} MB)`);

                const csvContent = new TextDecoder('utf-8').decode(fileData.data);
                const lines = csvContent.split('\n');
                console.log(`CSV file has ${lines.length} lines`);

                // Truncate large CSV files for performance
                const truncated = truncateContent(csvContent);

                return {
                    originalContent: csvContent,
                    convertedContent: truncated.content,
                    originalSize: csvContent.length,
                    convertedSize: truncated.content.length,
                    truncated: truncated.wasTruncated,
                    originalRowCount: lines.length,
                    processedRowCount: truncated.wasTruncated
                        ? Math.floor(lines.length * (truncated.content.length / csvContent.length))
                        : lines.length,
                };
            }

            case 'application/pdf': {
                const original = new TextDecoder('utf-8').decode(fileData.data);
                const converted = await convertPdfToText(fileData);
                return {
                    originalContent: original,
                    convertedContent: converted,
                    originalSize: fileData.data.byteLength,
                    convertedSize: converted.length,
                };
            }

            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.ms-excel': {
                // Optimized Excel processing - convert to CSV and process directly
                const original = `[Binary ${fileData.type.includes('spreadsheetml') ? 'XLSX' : 'XLS'} file]`;
                const csvData = await convertXlsxToCsv(fileData);

                // Process and truncate CSV data for performance
                const lines = csvData.split('\n');
                const truncated = truncateContent(csvData);

                return {
                    originalContent: original,
                    convertedContent: truncated.content,
                    originalSize: fileData.data.byteLength,
                    convertedSize: truncated.content.length,
                    truncated: truncated.wasTruncated,
                    originalRowCount: lines.length,
                    processedRowCount: truncated.wasTruncated
                        ? Math.floor(lines.length * (truncated.content.length / csvData.length))
                        : lines.length,
                };
            }

            default: {
                // Check if this file should be processed as plain text (JSON, JS, etc.)
                if (shouldProcessAsPlainText(fileData.type)) {
                    console.log(`Processing ${fileData.type} as plain text (no Pandoc needed)`);
                    const converted = new TextDecoder('utf-8').decode(fileData.data);
                    return {
                        originalContent: converted,
                        convertedContent: converted,
                        originalSize: converted.length,
                        convertedSize: converted.length,
                    };
                }

                // For files with ambiguous MIME types like text/plain, check the file extension
                if (fileData.type === 'text/plain' || fileData.type === '') {
                    if (isFileTypeSupported(fileData.name)) {
                        console.log(
                            `Processing ${fileData.name} (${fileData.type}) as plain text based on file extension`
                        );
                        const converted = new TextDecoder('utf-8').decode(fileData.data);
                        return {
                            originalContent: converted,
                            convertedContent: converted,
                            originalSize: converted.length,
                            convertedSize: converted.length,
                        };
                    }
                }

                // Check if this file actually needs Pandoc conversion
                if (needsPandocConversion(fileData.type)) {
                    const pandocFormat = mimeTypeToPandocFormat(fileData.type);
                    if (pandocFormat) {
                        console.log(`Processing ${fileData.type} with Pandoc (format: ${pandocFormat})`);

                        return await processFileWithPandoc(fileData, pandocFormat);
                    }
                }

                // Unsupported file type
                console.log(`Unsupported file format: ${fileData.type} for file: ${fileData.name}`);
                return null;
            }
        }
    } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.error(`[Performance] Error processing ${fileData.name} after ${duration.toFixed(2)}ms:`, error);
        throw error instanceof Error ? error : new Error(String(error));
    } finally {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`[Performance] Completed processing ${fileData.name} in ${duration.toFixed(2)}ms`);
    }
}

async function processFileWithPandoc(
    fileData: FileProcessingRequest['file'],
    inputFormat: string
): Promise<FileProcessingResponse['result']> {
    console.log('processFileWithPandoc in worker');

    // For binary files, don't try to decode as UTF-8 text
    const isBinaryFile =
        fileData.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileData.type === 'application/vnd.ms-excel' ||
        fileData.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileData.type === 'application/msword';

    const original = isBinaryFile
        ? `[Binary ${inputFormat.toUpperCase()} file]`
        : new TextDecoder('utf-8').decode(fileData.data);

    try {
        const pandoc = await getPandocConverter();
        const converted = await pandoc.convert(fileData.data, inputFormat);

        // Check if conversion produced any content
        if (!converted || converted.trim() === '') {
            const errorMsg = `Pandoc conversion produced empty output for ${fileData.type}. This may indicate the format is not supported by the WASM build.`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        return {
            originalContent: original,
            convertedContent: converted,
            originalSize: fileData.data.byteLength,
            convertedSize: converted.length,
        };
    } catch (error) {
        console.error(`Error converting ${fileData.type} with pandoc:`, error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}

async function convertPdfToText(fileData: FileProcessingRequest['file']): Promise<string> {
    const parseResult = await pdfParse(fileData.data);
    return parseResult.text;
}

// Handle messages from the main thread
self.addEventListener('message', async (event: MessageEvent<FileProcessingRequest>) => {
    const { id, file } = event.data;

    try {
        const result = await processFile(file);

        if (result === null) {
            // Unsupported file type
            const response: FileProcessingResponse = {
                id,
                success: false,
                isUnsupported: true,
            };
            self.postMessage(response);
        } else {
            // Success
            const response: FileProcessingResponse = {
                id,
                success: true,
                result,
            };
            self.postMessage(response);
        }
    } catch (error) {
        // Error during processing
        const errorMessage = error instanceof Error ? error.message : String(error);
        const response: FileProcessingResponse = {
            id,
            success: false,
            error: errorMessage || 'Unknown error during file processing',
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
