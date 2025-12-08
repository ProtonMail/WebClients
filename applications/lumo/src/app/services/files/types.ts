// Internally we don't need the id field, it will be reinjected when sending the response using postMessage()
import type { ImageProcessingResult, ProcessingError, TextProcessingResult } from '../fileProcessingService';

export type InternalTextResult = Omit<TextProcessingResult, 'id'>;
export type InternalImageResult = Omit<ImageProcessingResult, 'id'>;
export type InternalError = Omit<ProcessingError, 'id'>;
export type InternalFileResult = InternalTextResult | InternalImageResult | InternalError;

export interface TruncationResult {
    content: string;
    wasTruncated: boolean;
}
