/**
 * File type helper utilities
 * Centralizes file type checking logic using getProcessingCategory
 */

import { getProcessingCategory } from './filetypes';

/**
 * Check if a file is a spreadsheet (CSV or Excel)
 */
export function isSpreadsheetFile(file: File): boolean {
    const category = getProcessingCategory(file.type, file.name);
    return category === 'csv' || category === 'excel';
}

/**
 * Check if a file is a large spreadsheet (> 1MB)
 * Used to provide special user messaging for large spreadsheet processing
 */
export function isLargeSpreadsheetFile(file: File): boolean {
    return isSpreadsheetFile(file) && file.size > 1024 * 1024;
}

/**
 * Check if a file is a presentation file (PowerPoint)
 * These files are not supported and users should convert to PDF
 */
export function isPresentationFile(file: File): boolean {
    const presentationMimeTypes = [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
    ];

    const presentationExtensions = ['pptx', 'ppt'];
    const fileExtension = file.name.toLowerCase().split('.').pop();

    return (
        presentationMimeTypes.includes(file.type) ||
        (fileExtension ? presentationExtensions.includes(fileExtension) : false)
    );
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
    return getProcessingCategory(file.type, file.name) === 'image';
}

/**
 * Check if a file is a PDF
 */
export function isPdfFile(file: File): boolean {
    return getProcessingCategory(file.type, file.name) === 'pdf';
}

/**
 * Check if a file is a text file
 */
export function isTextFile(file: File): boolean {
    return getProcessingCategory(file.type, file.name) === 'text';
}

/**
 * Check if a file type is supported for processing
 */
export function isSupportedFile(file: File): boolean {
    return getProcessingCategory(file.type, file.name) !== 'unsupported';
}
