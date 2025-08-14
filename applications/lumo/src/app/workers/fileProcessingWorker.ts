import { PandocConverter } from '../lib/attachments/pandoc-wasm';
import pdfParse from '../lib/attachments/pdfParse';
import { mimeTypeToPandocFormat, shouldProcessAsPlainText, needsPandocConversion } from '../util/mimetype';
import { isFileTypeSupported } from '../util/filetypes';

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

        // Import xlsx library dynamically
        const XLSX = await import('xlsx');

        // Read the Excel file
        const workbook = XLSX.read(fileData.data, {
            type: 'array',
            // Performance optimizations
            cellDates: false, // Don't parse dates
            cellNF: false, // Don't parse number formats
            cellStyles: false, // Don't parse styles
            sheetStubs: false, // Don't create stubs for empty cells
        });

        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw new Error('Excel file contains no worksheets');
        }

        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            throw new Error('Could not read Excel worksheet');
        }

        // Convert the entire sheet to CSV
        const csvData = XLSX.utils.sheet_to_csv(worksheet);

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
    try {
        switch (fileData.type) {
            case 'text/plain': {
                const converted = new TextDecoder('utf-8').decode(fileData.data);
                return {
                    originalContent: converted,
                    convertedContent: converted,
                    originalSize: converted.length,
                    convertedSize: converted.length,
                };
            }

            case 'text/csv': {
                // Direct CSV processing - no need for Pandoc conversion
                console.log(`Processing CSV file: ${fileData.name} (${(fileData.size / 1024 / 1024).toFixed(2)} MB)`);

                const csvContent = new TextDecoder('utf-8').decode(fileData.data);
                const lines = csvContent.split('\n');
                console.log(`CSV file has ${lines.length} lines`);

                return {
                    originalContent: csvContent,
                    convertedContent: csvContent,
                    originalSize: csvContent.length,
                    convertedSize: csvContent.length,
                    truncated: false,
                    originalRowCount: lines.length,
                    processedRowCount: lines.length,
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

                // Process complete CSV data
                const lines = csvData.split('\n');

                return {
                    originalContent: original,
                    convertedContent: csvData,
                    originalSize: fileData.data.byteLength,
                    convertedSize: csvData.length,
                    truncated: false,
                    originalRowCount: lines.length,
                    processedRowCount: lines.length,
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
                        console.log(`Processing ${fileData.name} (${fileData.type}) as plain text based on file extension`);
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
        console.error('Error processing file:', error);
        throw error instanceof Error ? error : new Error(String(error));
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
