/**
 * MIME type utilities
 * 
 * This module re-exports functionality from filetypes.ts to maintain
 * backward compatibility for WASM and other specific use cases,
 * while keeping the single source of truth in filetypes.ts
 */

import { 
    mimeTypeToPandocFormat as _mimeTypeToPandocFormat,
    shouldProcessAsPlainText as _shouldProcessAsPlainText,
    needsPandocConversion as _needsPandocConversion
} from './filetypes';

export function mimeTypeToPandocFormat(mimeType: string): string | undefined {
    return _mimeTypeToPandocFormat(mimeType);
}

export function shouldProcessAsPlainText(mimeType: string): boolean {
    return _shouldProcessAsPlainText(mimeType);
}

export function needsPandocConversion(mimeType: string): boolean {
    return _needsPandocConversion(mimeType);
} 