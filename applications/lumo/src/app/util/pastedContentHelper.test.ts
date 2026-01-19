import { describe, expect, it } from '@jest/globals';
import {
    createAttachmentFromPastedContent,
    getPasteConversionMessage,
    PASTE_TO_ATTACHMENT_CONFIG,
    shouldConvertPasteToAttachment,
} from './pastedContentHelper';
import { parseFileReferences } from './fileReferences';

describe('pastedContentHelper', () => {
    describe('shouldConvertPasteToAttachment', () => {
        it('should return false for small content', () => {
            const smallContent = 'This is a small piece of text';
            expect(shouldConvertPasteToAttachment(smallContent)).toBe(false);
        });

        it('should return true for content with many lines', () => {
            const manyLines = Array(PASTE_TO_ATTACHMENT_CONFIG.MIN_LINES + 1)
                .fill('line')
                .join('\n');
            expect(shouldConvertPasteToAttachment(manyLines)).toBe(true);
        });

        it('should return true for content with many characters', () => {
            const manyChars = 'a'.repeat(PASTE_TO_ATTACHMENT_CONFIG.MIN_CHARS + 1);
            expect(shouldConvertPasteToAttachment(manyChars)).toBe(true);
        });

        it('should return false for empty content', () => {
            expect(shouldConvertPasteToAttachment('')).toBe(false);
        });

        it('should return false for null/undefined', () => {
            expect(shouldConvertPasteToAttachment(null as any)).toBe(false);
            expect(shouldConvertPasteToAttachment(undefined as any)).toBe(false);
        });
    });

    describe('createAttachmentFromPastedContent', () => {
        it('should create a valid attachment object', () => {
            const content = 'Test content for attachment';
            const attachment = createAttachmentFromPastedContent(content);

            expect(attachment).toHaveProperty('id');
            expect(attachment).toHaveProperty('filename');
            expect(attachment).toHaveProperty('mimeType');
            expect(attachment).toHaveProperty('markdown', content);
            expect(attachment).toHaveProperty('data');
            expect(attachment).toHaveProperty('uploadedAt');
            expect(attachment).toHaveProperty('rawBytes');
            expect(attachment).toHaveProperty('tokenCount');
            expect(attachment.processing).toBe(false);
        });

        it('should encode content as UTF-8', () => {
            const content = 'Test with émojis 🎉 and spëcial çharacters';
            const attachment = createAttachmentFromPastedContent(content);

            // Decode the data to verify it matches
            const decoder = new TextDecoder();
            const decoded = decoder.decode(attachment.data);
            expect(decoded).toBe(content);
        });

        it('should calculate rawBytes correctly', () => {
            const content = 'Test content';
            const attachment = createAttachmentFromPastedContent(content);
            const encoder = new TextEncoder();
            const expectedBytes = encoder.encode(content).length;
            expect(attachment.rawBytes).toBe(expectedBytes);
        });
    });

    describe('getPasteConversionMessage', () => {
        it('should return line-based message when line threshold is met', () => {
            const message = getPasteConversionMessage(100, 1000);
            expect(message).toContain('100 lines');
            expect(message).toContain('converted to attachment');
        });

        it('should return character-based message when only char threshold is met', () => {
            const message = getPasteConversionMessage(10, 5000);
            expect(message).toContain('5K characters');
            expect(message).toContain('converted to attachment');
        });

        it('should prioritize line count in message', () => {
            const message = getPasteConversionMessage(75, 10000);
            expect(message).toContain('75 lines');
            expect(message).not.toContain('characters');
        });
    });

    describe('parseFileReferences', () => {
        it('should parse @filename.pdf with spaces', () => {
            const content = 'hey lumo, what is in @Q1 - Lumo - Planning - OKR.pdf?';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(1);
            expect(refs[0].fileName).toBe('Q1 - Lumo - Planning - OKR.pdf');
        });

        it('should parse @filename.pdf without spaces', () => {
            const content = 'check out @document.pdf';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(1);
            expect(refs[0].fileName).toBe('document.pdf');
        });

        it('should parse multiple file references', () => {
            const content = 'compare @file1.pdf and @file 2.docx';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(2);
        });

        it('should handle @file references at end of sentence', () => {
            const content = 'what is in @my document.pdf.';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(1);
            expect(refs[0].fileName).toBe('my document.pdf');
        });

        it('should handle @file references with question mark', () => {
            const content = 'what is in @Q1 - Lumo - Planning - OKR.pdf?';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(1);
            expect(refs[0].fileName).toBe('Q1 - Lumo - Planning - OKR.pdf');
        });

        it('should handle multiple @file references with complex names', () => {
            const content = 'compare @File-One 2024.pdf with @File Two (v2).docx';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(2);
            expect(refs[0].fileName).toBe('File-One 2024.pdf');
            expect(refs[1].fileName).toBe('File Two (v2).docx');
        });

        it('should handle @file at end of message', () => {
            const content = 'please review @document.pdf';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(1);
            expect(refs[0].fileName).toBe('document.pdf');
        });
    });
});
